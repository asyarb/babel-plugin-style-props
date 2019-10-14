import { types as t } from '@babel/core'
import { Expression, JSXAttribute } from '@babel/types'
import { PluginOptions } from '../types'

export const processVariantProps = (
  props: JSXAttribute[],
  options: PluginOptions
) => {
  const variantProps = props.map(prop => {
    const name = prop.name.name as string
    const value = prop.value as Expression
    const variantThemeKey = options.variants[name]

    return t.objectProperty(t.identifier(variantThemeKey), value)
  })
  const variantObj = t.objectExpression(variantProps)

  return t.objectProperty(t.identifier('variants'), variantObj)
}
