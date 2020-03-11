import { types as t } from '@babel/core'
import { Expression } from '@babel/types'

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
