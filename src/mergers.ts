import { types as t } from '@babel/core'
import { ArrayExpression, ObjectExpression, ObjectProperty } from '@babel/types'
import { buildObjectProperty, buildStyleObject } from './builders'

const mergeCss = (existingCss: ObjectProperty, newCss: ObjectProperty) => {
  const existingValue = existingCss.value as ObjectExpression
  const newValue = newCss.value as ObjectExpression

  const [existingBase] = existingValue.properties as ObjectProperty[]
  const [newBase] = newValue.properties as ObjectProperty[]

  const existingObjs = existingBase.value as ArrayExpression
  const newObjs = newBase.value as ArrayExpression

  const existingEls = existingObjs.elements as ObjectExpression[]
  const newEls = newObjs.elements as ObjectExpression[]
  const numBreakpoints = Math.max(existingEls.length, newEls.length)

  const mergedEls = [] as ObjectExpression[]
  for (let i = 0; i < numBreakpoints; i++) {
    const existingProperties = existingEls[i] ? existingEls[i].properties : []
    const newProperties = newEls[i] ? newEls[i].properties : []

    mergedEls.push(
      t.objectExpression([...existingProperties, ...newProperties])
    )
  }
  const mergedBase = buildObjectProperty('base', t.arrayExpression(mergedEls))

  return { mergedBase }
}

const mergeExtensions = (
  existingExtensions: ObjectProperty,
  newExtensions: ObjectProperty
) => {
  const existingValue = existingExtensions.value as ObjectExpression
  const newValue = newExtensions.value as ObjectExpression

  const [existingScales] = existingValue.properties as ObjectProperty[]
  const [newScales] = newValue.properties as ObjectProperty[]

  const {
    properties: existingScaleProperties,
  } = existingScales.value as ObjectExpression
  const { properties: newScaleProperties } = newScales.value as ObjectExpression

  const mergedScaleProperties = [
    ...existingScaleProperties,
    ...newScaleProperties,
  ]
  const mergedScales = buildObjectProperty(
    'scales',
    t.objectExpression(mergedScaleProperties)
  )

  return { mergedScales }
}

export const mergeStyleObjects = (
  existingObj: ObjectExpression,
  newObj: ObjectExpression
) => {
  const [
    existingCss,
    existingExtensions,
  ] = existingObj.properties as ObjectProperty[]
  const [newCss, newExtensions] = newObj.properties as ObjectProperty[]

  const { mergedBase } = mergeCss(existingCss, newCss)
  const { mergedScales } = mergeExtensions(existingExtensions, newExtensions)

  return buildStyleObject(mergedBase, mergedScales)
}
