import { types as t } from '@babel/core'
import { JSXAttribute, ObjectProperty } from '@babel/types'

import { StylePropExpression } from './'
import { buildObjectProperty } from './builders'
import { STYLE_ALIASES } from './constants'
import { castArray, extractPropBaseName, shouldSkipProp } from './utils'

export enum STYLE_PROP_TYPE {
  BASE = 'base',
  HOVER = 'hover',
  FOCUS = 'focus',
  ACTIVE = 'active',
}

const processProp = (
  cssPropertyNames: string[],
  expression: StylePropExpression,
  result: ObjectProperty[]
) => {
  cssPropertyNames.forEach(cssName => {
    if (shouldSkipProp(expression)) return

    result.push(buildObjectProperty(cssName, expression!))
  })
}

export const processStyleProps = (
  styleProps: JSXAttribute[],
  type: STYLE_PROP_TYPE
) => {
  const baseResult = [] as ObjectProperty[]
  const responsiveResults = [] as ObjectProperty[][]

  styleProps.forEach(prop => {
    const propName = prop.name.name as string
    const { propBaseName } = extractPropBaseName(propName)
    const propValue = prop.value

    const cssPropertyNames = castArray(
      STYLE_ALIASES[propBaseName] || propBaseName
    )

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
      processProp(cssPropertyNames, propValue, baseResult)
    }
  })

  const baseResultObj = t.objectExpression(baseResult)
  const responsiveResultObjs = responsiveResults.map(properties =>
    t.objectExpression(properties)
  )

  return buildObjectProperty(
    type,
    t.arrayExpression([baseResultObj, ...responsiveResultObjs])
  )
}
