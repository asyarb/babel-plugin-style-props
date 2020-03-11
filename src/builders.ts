import { types as t } from '@babel/core'
import { Expression } from '@babel/types'

import { ResponsiveStyles } from './utils'

/**
 * Builds an object property with the provided parameters.
 *
 * @param identifier - The key of the object property.
 * @param expression - The value of the property.
 *
 * @returns An `ObjectProperty`.
 */
export const buildObjectProperty = (
  identifier: string,
  expression: Expression
) => t.objectProperty(t.identifier(identifier), expression)

/**
 * Provided keyed and grouped repsonsive styles, creates an injectable prop
 *
 * @param responsiveStyles - The responsive styles.
 *
 * @returns An object expression representing the responsive styles.
 */
export const buildInjectableProp = (responsiveStyles: ResponsiveStyles) => {
  const responsiveProperties = Object.entries(
    responsiveStyles
  ).map(([key, value]) => buildObjectProperty(key, t.arrayExpression(value)))

  return t.objectExpression(responsiveProperties)
}
