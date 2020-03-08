import { types as t } from '@babel/core'
import {
  Expression,
  JSXAttribute,
  JSXEmptyExpression,
  JSXSpreadAttribute,
  JSXExpressionContainer,
  SpreadElement,
  ObjectExpression,
  ObjectProperty,
  Identifier,
} from '@babel/types'

import { PluginOptions } from './'
import {
  VALID_STYLE_NAMES,
  INJECTED_PROP_NAME,
  STYLE_ALIASES,
} from './constants'
import { buildObjectProperty } from './builders'

/**
 * Given a value, casts the value to an array if it is not one.
 *
 * @param x - The value to cast to an array.
 *
 * @returns The casted array.
 */
export const castArray = <T>(x: T | T[]): T[] => (Array.isArray(x) ? x : [x])

/**
 * Creates an array containing all but the first element of an array.
 *
 * @param array - The array to get the tail of.
 *
 * @returns A new array containing the tail elements.
 */

export const tail = <T>(array: T[]) => {
  if (!Array.isArray(array)) return []

  const [, ...x] = array

  return x
}

/**
 * Given any style, returns `true` if the prop should be skipped
 * for style-prop processing, `false` otherwise.
 *
 * @param prop
 */
export const shouldSkipStyle = (
  prop: null | Expression | SpreadElement | JSXEmptyExpression
) => t.isNullLiteral(prop)

/**
 * Given a list of all props, returns the appropriate scoped prop that contains
 * all the style props.
 *
 * @param props - The list of props from a JSXElement.
 * @param scopedPropName - The name of the prop to look for in the list.
 *
 * @returns The JSXAttribute whose name is `scopedPropName`, `undefined` otherwise.
 */
export const extractInternalProps = (
  props: (JSXAttribute | JSXSpreadAttribute)[],
  options: PluginOptions
) => {
  let scopedProp: JSXAttribute | undefined
  let existingProp: JSXAttribute | undefined

  props.forEach(prop => {
    if (t.isJSXSpreadAttribute(prop)) return

    if (prop.name.name === options.prop) {
      scopedProp = prop
      return
    }
    if (prop.name.name === INJECTED_PROP_NAME) {
      existingProp = prop
      return
    }
  })

  return { scopedProp, existingProp }
}

/**
 * Given a style's name, extracts the base name.
 *
 * @example `getBaseStyleName('colorHover') => `color``
 *
 * @param styleName - Style name to extract the base name from.
 *
 * @returns The base style name.
 */
const extractBaseStyleInfo = (styleName: string, options: PluginOptions) => {
  const { psuedoClases } = options

  type BaseStyle = {
    name: string
    type: keyof PluginOptions['psuedoClases'] | 'base'
  }

  let baseStyle: BaseStyle = {
    name: styleName,
    type: 'base',
  }

  // A `for of` loop allows us to break early if we find a match.
  for (const [key, regExp] of Object.entries(psuedoClases)) {
    if (!styleName.match(regExp)) continue

    // We found a match, so replace and break early.
    baseStyle.name = styleName.replace(regExp, '')
    baseStyle.type = key
    break
  }

  return baseStyle
}

type NormalizedStyles = {
  [key: string]: ObjectProperty['value']
}
type GroupedStyles = {
  [key: string]: NormalizedStyles
}

export const normalizeAndGroupStyles = (
  scopedProp: JSXAttribute,
  options: PluginOptions
) => {
  const { psuedoClases } = options

  const scopedPropValue = scopedProp.value as JSXExpressionContainer
  const scopedPropObj = scopedPropValue.expression as ObjectExpression
  const allStyleProperties = scopedPropObj.properties

  // Initializes our collection.
  let groupedStyles = Object.keys(psuedoClases).reduce(
    (acc, key) => {
      acc[key] = {}

      return acc
    },
    { base: {} } as GroupedStyles
  )

  allStyleProperties.forEach(style => {
    if (!t.isObjectProperty(style)) return

    const key: Identifier = style.key
    const value = style.value
    const rawStyleName = key.name as string

    const { name, type: styleType } = extractBaseStyleInfo(
      rawStyleName,
      options
    )
    if (!VALID_STYLE_NAMES.includes(name)) return

    const cssProperties = castArray(STYLE_ALIASES[name] ?? name)

    cssProperties.forEach(cssProperty => {
      groupedStyles[styleType][cssProperty] = value
    })
  })

  return groupedStyles
}

type PsuedoResponsiveObj = { [key: string]: ObjectExpression[] }

/**
 * Provided the style prop, returns a list of all styles e.g. `mx`, scale styles e.g. `mxScale`, variants, and psuedoClass styles.
 *
 * @param scopedProp - The scoped style prop.
 * @param options - The babel plugin options.
 *
 * @returns An object containing namespaced objects for each style type.
 */
export const responsifyStyles = (groupedStylesObj: GroupedStyles) => {
  const groupedStyles = Object.entries(groupedStylesObj)

  const responsivePsuedoGroups = groupedStyles.reduce((acc, [key, value]) => {
    const styles = Object.entries(value)

    let mobile = [] as ObjectProperty[]
    let responsive = [] as ObjectProperty[][]

    styles.forEach(([cssKey, cssValue]) => {
      if (t.isArrayExpression(cssValue)) {
        cssValue.elements.forEach((el, idx) => {
          responsive[idx] = responsive[idx] ?? []

          const element = el as Expression
          if (shouldSkipStyle(element)) return

          const styleProperty = buildObjectProperty(cssKey, element)

          if (idx === 0) {
            mobile.push(styleProperty)
            return
          }

          responsive[idx].push(styleProperty)
        })
      } else {
        if (shouldSkipStyle(cssValue as Expression)) return

        mobile.push(buildObjectProperty(cssKey, cssValue as Expression))
      }
    })

    const mobileObjExpression = t.objectExpression(mobile)
    const responsiveExpressions = responsive.map(styles =>
      t.objectExpression(styles)
    )

    acc[key] = [mobileObjExpression, ...tail(responsiveExpressions)]

    return acc
  }, {} as PsuedoResponsiveObj)

  return responsivePsuedoGroups
}

export const buildFinalObjectExp = (responsiveStyles: PsuedoResponsiveObj) => {
  const responsiveProperties = Object.entries(responsiveStyles).map(
    ([key, value]) => {
      return buildObjectProperty(key, t.arrayExpression(value))
    }
  )

  return t.objectExpression(responsiveProperties)
}
