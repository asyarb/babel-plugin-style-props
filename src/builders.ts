import { types as t } from '@babel/core'
import { Expression, ObjectProperty } from '@babel/types'

export const buildObjectProperty = (
  identifier: string,
  expression: Expression
) => t.objectProperty(t.identifier(identifier), expression)

export const buildInjectableObject = ({
  css,
  extensions,
}: {
  css: ObjectProperty[]
  extensions: ObjectProperty[]
}) => {
  const cssKey = buildObjectProperty('css', t.objectExpression(css))
  const extensionsKey = buildObjectProperty(
    'extensions',
    t.objectExpression(extensions)
  )

  return t.objectExpression([cssKey, extensionsKey])
}
