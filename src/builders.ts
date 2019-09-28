import { types as t } from '@babel/core'
import { Expression, ObjectExpression } from '@babel/types'

export const buildObjectProperty = (
  identifier: string,
  expression: Expression
) => t.objectProperty(t.identifier(identifier), expression)

export const mergeStyleObjects = (
  existingObj: ObjectExpression,
  newObj: ObjectExpression
) => {
  console.log({ existingObj, newObj })
}
