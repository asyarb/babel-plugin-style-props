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
