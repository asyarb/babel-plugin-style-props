import { SYSTEM_PROPS } from './constants'

/**
 * Casts a provided value as an array if it is not one.
 *
 * @param {*} x - The value to cast to an array.
 * @returns The casted array.
 */
export const castArray = x => (Array.isArray(x) ? x : [x])

/**
 * Returns a valid media query given a CSS unit.
 *
 * @param {*} n - The CSS unit to generate a media query from.
 * @returns The media query string.
 */
export const createMediaQuery = unit => `@media screen and (min-width: ${unit})`

/**
 * Given an array of props, returns only the known system props.
 *
 * @param {Array} attrs - Props to filter.
 * @returns The array of system props.
 */
export const onlySystemProps = (context, attrs) => {
  const { variants } = context

  return attrs.filter(attr =>
    Boolean(SYSTEM_PROPS[attr.name.name] || variants[attr.name.name]),
  )
}
/**
 * Given an array of props, returns only non-system props.
 *
 * @param {Array} attrs - Props to filter.
 * @returns The array of non-system props.
 */
export const notSystemProps = (context, attrs) => {
  const { variants } = context

  return attrs.filter(
    attr => !Boolean(SYSTEM_PROPS[attr.name.name] || variants[attr.name.name]),
  )
}
