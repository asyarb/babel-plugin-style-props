import { types as t } from '@babel/core'
import { Expression, JSXEmptyExpression, SpreadElement } from '@babel/types'
import { STYLE_ALIASES } from './constants'
import { castArray, shouldSkipProp } from './utils'

type ResultObject = {
  [key: string]: null | Expression | SpreadElement | JSXEmptyExpression
}

export const buildNamespacedObject = (
  context: PluginContext,
  _scaleProps: t.JSXAttribute[],
  styleProps: t.JSXAttribute[]
) => {
  const { variants } = context
  const baseResult = {} as ResultObject
  const responsiveResults = [] as ResultObject[]

  styleProps.forEach(prop => {
    const propName = prop.name.name as string
    const propValue = prop.value

    const cssPropertyNames = castArray(STYLE_ALIASES[propName] || propName)

    if (t.isJSXExpressionContainer(propValue)) {
      // e.g. prop={}
      const expression = propValue.expression

      if (t.isArrayExpression(expression)) {
        // e.g. prop={['foo', null, 'bar']}
        const elements = expression.elements
        elements.forEach((element, i) => {
          let resultObj: ResultObject

          if (i === 0) resultObj = baseResult
          else {
            if (!responsiveResults[i - 1]) responsiveResults[i - 1] = {}
            resultObj = responsiveResults[i - 1]
          }

          cssPropertyNames.forEach(cssName => {
            if (shouldSkipProp(element)) return

            resultObj[cssName] = element
          })
        })
      } else {
        // e.g. prop={text} prop={bool ? 'foo' : 'bar'}
        cssPropertyNames.forEach(cssName => {
          if (shouldSkipProp(expression)) return

          baseResult[cssName] = expression
        })
      }
    } else {
      // e.g. prop="test"
      const isVariant = Boolean(variants[propName])

      cssPropertyNames.forEach(cssName => {
        if (shouldSkipProp(propValue)) return

        if (isVariant) {
          // do nothing for now?
        } else {
          baseResult[cssName] = propValue
        }
      })
    }
  })

  return {
    baseResult,
    ...responsiveResults,
  }
}
