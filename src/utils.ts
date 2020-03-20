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
import { VALID_STYLE_NAMES, STYLE_ALIASES } from './constants'
import { buildObjectProperty } from './builders'
import { castArray, tail } from './helpers'

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

  props.forEach(prop => {
    if (t.isJSXSpreadAttribute(prop)) return

    if (prop.name.name === options.prop) {
      scopedProp = prop
      return
    }
  })

  return scopedProp
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

export const normalizeStyleNames = (
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

const processStyle = (
  key: string,
  value: ObjectProperty['value'],
  mobile: ObjectProperty[],
  responsive: ObjectProperty[][]
) => {
  if (t.isArrayExpression(value)) {
    value.elements.forEach((el, idx) => {
      responsive[idx] = responsive[idx] ?? []

      const element = el as Expression
      if (shouldSkipStyle(element)) return

      const styleProperty = buildObjectProperty(key, element)

      if (idx === 0) {
        mobile.push(styleProperty)
        return
      }

      responsive[idx].push(styleProperty)
    })
  } else {
    if (shouldSkipStyle(value as Expression)) return

    mobile.push(buildObjectProperty(key, value as Expression))
  }
}

const processScaleStyle = (
  key: string,
  value: ObjectProperty['value'],
  mobile: ObjectProperty[]
) => {
  if (t.isArrayExpression(value)) {
    mobile.push(buildObjectProperty(key, value as Expression))

    return
  }

  mobile.push(
    buildObjectProperty(key, t.arrayExpression([value as Expression]))
  )
}

export type ResponsiveStyles = { [key: string]: ObjectExpression[] }

/**
 * Provided a style prop, returns an object whose keys represent the
 * named psuedo classes. Each key contains an array whose items represent
 * styles at a breakpoint.
 *
 * @example { base: [{ margin: 1 }, {}, { padding: 3 }] }
 *
 * @param scopedProp - The scoped style prop.
 * @param options - The babel plugin options.
 *
 * @returns The responsive object.
 */
export const createKeyedResponsiveStyles = (
  groupedStylesObj: GroupedStyles
) => {
  const responsivePsuedoGroups = Object.entries(groupedStylesObj).reduce(
    (acc, [key, value]) => {
      const styles = Object.entries(value)

      let mobile = [] as ObjectProperty[]
      let responsive = [] as ObjectProperty[][]

      styles.forEach(([cssKey, cssValue]) => {
        if (key === 'scales') processScaleStyle(cssKey, cssValue, mobile)
        else processStyle(cssKey, cssValue, mobile, responsive)
      })

      const mobileObjExpression = t.objectExpression(mobile)
      const responsiveExpressions = responsive.map(styles =>
        t.objectExpression(styles)
      )

      // We use tail here since we never use the first element of
      // `responsiveExpressions`
      acc[key] = [mobileObjExpression, ...tail(responsiveExpressions)]

      return acc
    },
    {} as ResponsiveStyles
  )

  return responsivePsuedoGroups
}
