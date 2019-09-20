import { types as t } from '@babel/core'

import { STYLE_PROPS, SCALE_BASEPROP_MAP } from './constants'

/**
 * Casts a provided value as an array if it is not one.
 *
 * @param {*} x - The value to cast to an array.
 * @returns The casted array.
 */
export const castArray = x => (Array.isArray(x) ? x : [x])

export const times = (fn, num) => {
  const arr = []
  for (let i = 0; i < num; i++) {
    arr[i] = fn(i)
  }

  return arr
}

/**
 * Returns a valid media query given a CSS unit.
 *
 * @param {*} n - The CSS unit to generate a media query from.
 * @returns The media query string.
 */
export const createMediaQuery = unit => `@media screen and (min-width: ${unit})`

/**
 * Given an array of props, returns only the known style props.
 *
 * @param {Object} context
 * @param {Array} attrs - Props to filter.
 * @returns The array of system props.
 */
export const onlyStyleProps = (context, attrs) => {
  const { variants } = context

  return attrs.filter(attr =>
    Boolean(STYLE_PROPS[attr.name.name] || variants[attr.name.name])
  )
}

/**
 * Given an array of props, returns only the known scale props
 *
 * @param {Array} attrs - Props to filter.
 * @returns The array of system props.
 */
export const onlyScaleProps = attrs => {
  return attrs.filter(
    attr =>
      !t.isJSXSpreadAttribute(attr) &&
      Boolean(SCALE_BASEPROP_MAP[attr.name.name])
  )
}

/**
 * Given an array of props, returns only non-style props.
 *
 * @param {Object} context
 * @param {Array} attrs - Props to filter.
 * @returns The array of non-system props.
 */
export const notStyleProps = (context, attrs) => {
  const { shouldStripProps, variants } = context

  return attrs.filter(attr => {
    if (!shouldStripProps) return true

    const propName = attr.name.name

    return !(
      Boolean(STYLE_PROPS[propName]) ||
      Boolean(SCALE_BASEPROP_MAP[propName]) ||
      variants[propName]
    )
  })
}

/**
 * Checks if the provided Babel node is skippable by checking
 * if it is `null`.
 *
 * @param {Object} attrValue - Babel node to check.
 * @returns `true` if it is skippable, `false` otherwise.
 */
export const shouldSkipProp = attrValue => t.isNullLiteral(attrValue)

export const isStaticAttr = attrValue =>
  t.isStringLiteral(attrValue) ||
  t.isNumericLiteral(attrValue) ||
  t.isNullLiteral(attrValue)
