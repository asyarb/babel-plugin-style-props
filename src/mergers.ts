import { types as t } from '@babel/core'
import { ArrayExpression, ObjectExpression, ObjectProperty } from '@babel/types'

import { buildObjectProperty, buildInjectableObject } from './builders'

const mergeCssProps = (
  existingProps: ObjectProperty,
  newProps: ObjectProperty,
  type: string
) => {
  const existingObjs = existingProps.value as ArrayExpression
  const newObjs = newProps.value as ArrayExpression

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
  const mergedProps = buildObjectProperty(type, t.arrayExpression(mergedEls))

  return mergedProps
}

const mergeCss = (existingCss: ObjectProperty, newCss: ObjectProperty) => {
  const existingValue = existingCss.value as ObjectExpression
  const newValue = newCss.value as ObjectExpression

  const [
    existingBase,
    existingHover,
    existingFocus,
    existingActive,
  ] = existingValue.properties as ObjectProperty[]
  const [
    newBase,
    newHover,
    newFocus,
    newActive,
  ] = newValue.properties as ObjectProperty[]

  return {
    mergedBase: mergeCssProps(existingBase, newBase, 'base'),
    mergedHover: mergeCssProps(existingHover, newHover, 'hover'),
    mergedFocus: mergeCssProps(existingFocus, newFocus, 'focus'),
    mergedActive: mergeCssProps(existingActive, newActive, 'active'),
  }
}

const mergeExtensions = (
  existingExtensions: ObjectProperty,
  newExtensions: ObjectProperty
) => {
  const existingValue = existingExtensions.value as ObjectExpression
  const newValue = newExtensions.value as ObjectExpression

  const [
    existingScales,
    existingVariants,
  ] = existingValue.properties as ObjectProperty[]
  const [newScales, newVariants] = newValue.properties as ObjectProperty[]

  const {
    properties: existingScaleProperties,
  } = existingScales.value as ObjectExpression
  const { properties: newScaleProperties } = newScales.value as ObjectExpression
  const {
    properties: existingVariantProperties,
  } = existingVariants.value as ObjectExpression
  const {
    properties: newVariantProperties,
  } = newVariants.value as ObjectExpression

  const mergedScaleProperties = [
    ...existingScaleProperties,
    ...newScaleProperties,
  ]
  const mergedVariantProperties = [
    ...existingVariantProperties,
    ...newVariantProperties,
  ]

  const mergedScales = buildObjectProperty(
    'scales',
    t.objectExpression(mergedScaleProperties)
  )
  const mergedVariants = buildObjectProperty(
    'variants',
    t.objectExpression(mergedVariantProperties)
  )

  return { mergedScales, mergedVariants }
}

export const mergeInjectableObjects = (
  existingObj: ObjectExpression,
  newObj: ObjectExpression
) => {
  const [
    existingCss,
    existingExtensions,
  ] = existingObj.properties as ObjectProperty[]
  const [newCss, newExtensions] = newObj.properties as ObjectProperty[]

  const { mergedBase, mergedHover, mergedFocus, mergedActive } = mergeCss(
    existingCss,
    newCss
  )
  const { mergedScales, mergedVariants } = mergeExtensions(
    existingExtensions,
    newExtensions
  )

  return buildInjectableObject({
    css: [mergedBase, mergedHover, mergedFocus, mergedActive],
    extensions: [mergedScales, mergedVariants],
  })
}
