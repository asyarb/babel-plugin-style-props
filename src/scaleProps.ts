import { types as t } from '@babel/core'
import { JSXAttribute, ObjectProperty } from '@babel/types'
import { buildObjectProperty } from 'builders'
import { StylePropExpression } from '../types'
import { STYLE_ALIASES } from './constants'
import { castArray } from './utils'

const processScaleProp = (
  cssPropertyNames: string[],
  normalizedPropArr: StylePropExpression[],
  result: ObjectProperty[]
) => {
  cssPropertyNames.forEach(cssName => {
    result.push(
      buildObjectProperty(cssName, t.arrayExpression(normalizedPropArr))
    )
  })
}

export const processScaleProps = (scaleProps: JSXAttribute[]) => {
  const result = [] as ObjectProperty[]

  scaleProps.forEach(prop => {
    const propName = prop.name.name as string
    const basePropName = propName.replace('Scale', '')
    const propValue = prop.value

    const cssPropertyNames = castArray(
      STYLE_ALIASES[basePropName] || basePropName
    )

    if (t.isJSXExpressionContainer(propValue)) {
      const expression = propValue.expression as StylePropExpression

      if (t.isArrayExpression(expression)) {
        // e.g. propScale={['foo', null, 'bar']}
        const elements = expression.elements as StylePropExpression[]
        processScaleProp(cssPropertyNames, elements, result)
      } else {
        // e.g. propScale={array}
        const normalizedExpression = castArray(expression)
        processScaleProp(cssPropertyNames, normalizedExpression, result)
      }
    } else {
      // e.g. propScale="large"
      const normalizedProp = castArray(propValue)
      processScaleProp(cssPropertyNames, normalizedProp, result)
    }
  })

  return buildObjectProperty('scales', t.objectExpression(result))
}
