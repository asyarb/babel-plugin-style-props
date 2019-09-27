import { types as t } from '@babel/core'
import {
  ArrayExpression,
  JSXAttribute,
  ObjectExpression,
  ObjectProperty,
} from '@babel/types'
import { PluginContext } from '../types'
import { processScaleProps } from './scaleProps'
import { processStyleProps } from './styleProps'

export const buildStylePropsArrayExpression = (
  context: PluginContext,
  scaleProps: JSXAttribute[],
  styleProps: JSXAttribute[]
) => {
  const baseResult = [] as ObjectProperty[]
  const responsiveResults = [] as ObjectProperty[][]

  processStyleProps(context, styleProps, baseResult, responsiveResults)
  processScaleProps(scaleProps, baseResult, responsiveResults)

  const baseResultObj = t.objectExpression(baseResult)
  const responsiveResultObjs = responsiveResults.map(properties =>
    t.objectExpression(properties)
  )

  return t.arrayExpression([baseResultObj, ...responsiveResultObjs])
}

export const mergeStylePropArrayExpressions = (
  newArrExpression: ArrayExpression,
  existingArrExpression: ArrayExpression
) => {
  const existingStylePropsArr = existingArrExpression.elements as ObjectExpression[]
  const newStylePropsArr = newArrExpression.elements as ObjectExpression[]

  const numBreakpoints = Math.max(
    existingStylePropsArr.length,
    newStylePropsArr.length
  )

  const mergedProperties = [] as ObjectExpression[]
  for (let i = 0; i < numBreakpoints; i++) {
    const existingProperties = existingStylePropsArr[i]
      ? existingStylePropsArr[i].properties
      : []
    const newProperties = newStylePropsArr[i]
      ? newStylePropsArr[i].properties
      : []

    mergedProperties.push(
      t.objectExpression([...existingProperties, ...newProperties])
    )
  }

  return t.arrayExpression(mergedProperties)
}
