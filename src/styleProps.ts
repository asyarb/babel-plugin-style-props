import { types as t } from '@babel/core'
import { JSXAttribute, ObjectProperty } from '@babel/types'
import { PluginContext, StylePropExpression } from '../types'
import { STYLE_ALIASES } from './constants'
import { castArray, shouldSkipProp } from './utils'

const processProp = (
  cssPropertyNames: string[],
  expression: StylePropExpression,
  result: ObjectProperty[]
) => {
  cssPropertyNames.forEach(cssName => {
    if (shouldSkipProp(expression)) return

    result.push(t.objectProperty(t.identifier(cssName), expression!))
  })
}

export const processStyleProps = (
  context: PluginContext,
  styleProps: JSXAttribute[],
  baseResult: ObjectProperty[],
  responsiveResults: ObjectProperty[][]
) => {
  styleProps.forEach(prop => {
    const { variants } = context
    const propName = prop.name.name as string
    const propValue = prop.value
    const cssPropertyNames = castArray(STYLE_ALIASES[propName] || propName)

    if (t.isJSXExpressionContainer(propValue)) {
      const expression = propValue.expression as StylePropExpression

      if (t.isArrayExpression(expression)) {
        // e.g. prop={['foo', null, 'bar']}
        const elements = expression.elements as StylePropExpression[]
        elements.forEach((element, i) => {
          let resultObj = baseResult

          if (i !== 0) {
            responsiveResults[i - 1] = responsiveResults[i - 1] || []
            resultObj = responsiveResults[i - 1]
          }

          processProp(cssPropertyNames, element, resultObj)
        })
      } else {
        // e.g. prop={text} prop={bool ? 'foo' : 'bar'}
        processProp(cssPropertyNames, expression, baseResult)
      }
    } else {
      // e.g. prop="test"
      const isVariant = Boolean(variants[propName])
      if (isVariant) {
        // TODO
      }

      processProp(cssPropertyNames, propValue, baseResult)
    }
  })
}
