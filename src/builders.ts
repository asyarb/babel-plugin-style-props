import { types as t } from '@babel/core'
import { Expression, ObjectProperty } from '@babel/types'

export const buildObjectProperty = (
  identifier: string,
  expression: Expression
) => t.objectProperty(t.identifier(identifier), expression)

export const buildStyleObject = (
  base: ObjectProperty,
  scales: ObjectProperty
) => {
  const css = buildObjectProperty('css', t.objectExpression([base]))
  const extensions = buildObjectProperty(
    'extensions',
    t.objectExpression([scales])
  )

  return t.objectExpression([css, extensions])
}
