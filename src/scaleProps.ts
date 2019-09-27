import { types as t } from '@babel/core'
import { JSXAttribute, ObjectProperty } from '@babel/types'
import { StylePropExpression } from '../types'
import { STYLE_ALIASES } from './constants'
import { castArray, times } from './utils'

/**
 * Normalizes a list of scale prop elements to no longer contain any null values. Null values will inherit the `firstLeft` non-null property.
 *
 * @example ['l', null, 'm'] => ['l', 'l', 'm']
 *
 * @param elements
 * @returns The normalized scale elements array.
 */
const normalizeScale = (elements: StylePropExpression[]) => {
  const normalizedElements = times(i => {
    if (t.isNullLiteral(elements[i]) || elements[i] === undefined) {
      elements[i] = elements[i - 1] || t.nullLiteral()
    }

    return elements[i]
  }, 5)

  return normalizedElements
}

const processScaleProp = (
  cssPropertyNames: string[],
  normalizedPropArr: StylePropExpression[],
  baseResult: ObjectProperty[],
  responsiveResults: ObjectProperty[][]
) => {
  normalizedPropArr.forEach((element, i) => {
    let resultObj = baseResult

    if (i !== 0) {
      responsiveResults[i - 1] = responsiveResults[i - 1] || []
      resultObj = responsiveResults[i - 1]
    }

    cssPropertyNames.forEach(cssName => {
      resultObj.push(
        t.objectProperty(
          t.identifier(cssName),
          t.memberExpression(element!, t.numericLiteral(i), true)
        )
      )
    })
  })
}

export const processScaleProps = (
  scaleProps: JSXAttribute[],
  baseResult: ObjectProperty[],
  responsiveResults: ObjectProperty[][]
) => {
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
        const normalizedElements = normalizeScale(elements)

        processScaleProp(
          cssPropertyNames,
          normalizedElements,
          baseResult,
          responsiveResults
        )
      } else {
        // e.g. propScale={array}
        const normalizedExpression = normalizeScale(castArray(expression))

        processScaleProp(
          cssPropertyNames,
          normalizedExpression,
          baseResult,
          responsiveResults
        )
      }
    } else {
      // e.g. propScale="large"
      const normalizedProp = normalizeScale(castArray(propValue))

      processScaleProp(
        cssPropertyNames,
        normalizedProp,
        baseResult,
        responsiveResults
      )
    }
  })
}
