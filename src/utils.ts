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

/**
 * Given a value, casts the value to an array if it is not one.
 *
 * @param x - The value to cast to an array.
 *
 * @returns The casted array.
 */
export const castArray = <T>(x: T | T[]): T[] => (Array.isArray(x) ? x : [x])

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
export const extractScopedProp = (
  props: (JSXAttribute | JSXSpreadAttribute)[],
  scopedPropName: string
) => {
  let scopedProp: JSXAttribute | undefined
  let existingProp: JSXAttribute | undefined

  props.forEach(prop => {
    if (t.isJSXSpreadAttribute(prop)) return

    if (prop.name.name !== scopedPropName) scopedProp = prop
    if (prop.name.name === INJECTED_PROP_NAME) existingProp = prop
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

type Styles = {
  [key: string]: ObjectProperty['value']
}
type GroupedStyles = {
  [key: string]: Styles
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

/**
 * Provided the style prop, returns a list of all styles e.g. `mx`, scale styles e.g. `mxScale`, variants, and psuedoClass styles.
 *
 * @param scopedProp - The scoped style prop.
 * @param options - The babel plugin options.
 *
 * @returns An object containing namespaced objects for each style type.
 */
export const responsifyStyles = (
  groupedStyles: GroupedStyles,
  options: PluginOptions
) => {
  // TODO:
}

/**
 * Given a list of props, returns a new list with the `__styleProp__` prop removed.
 *
 * @param props - The list of props to filter.
 *
 * @returns An array with the internal styleProp prop removed.
 */
export const stripInternalProp = (
  props: (JSXAttribute | JSXSpreadAttribute)[]
) => {
  return props.filter(prop => {
    if (t.isJSXSpreadAttribute(prop)) return true
    if (t.isJSXAttribute(prop) && prop.name.name !== INJECTED_PROP_NAME)
      return true

    return false
  })
}
