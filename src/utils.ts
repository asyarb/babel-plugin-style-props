import { types as t } from '@babel/core'
import { Expression, JSXEmptyExpression, SpreadElement } from '@babel/types'
import { SCALE_BASEPROP_MAP, STYLE_PROPS } from './constants'

export const castArray = <T>(x: T | T[]) => (Array.isArray(x) ? x : [x])

/**
 * Given a list of props, returns a list of all the explicit props, e.g. `prop="myProp"` and spread props e.g. `{...props}`.
 *
 * @param props
 *
 * @returns An object containing `explicitProps` and `spreadProps`.
 */
export const extractProps = (
  props: (t.JSXAttribute | t.JSXSpreadAttribute)[]
) => {
  const explicitProps = [] as t.JSXAttribute[]
  const spreadProps = [] as t.JSXSpreadAttribute[]

  props.forEach(prop => {
    if (t.isJSXSpreadAttribute(prop)) spreadProps.push(prop)
    else explicitProps.push(prop)
  })

  return { explicitProps, spreadProps }
}

/**
 * Given a list of explicit props, returns a list of all style props e.g. `mx=""` and scale props e.g. `mxScale=""`
 *
 * @param context
 * @param props
 *
 * @returns An object containing `styleProps` and `scaleProps`.
 */
export const extractStyleProps = (
  context: PluginContext,
  props: t.JSXAttribute[]
) => {
  const { variants } = context
  const styleProps = [] as t.JSXAttribute[]
  const scaleProps = [] as t.JSXAttribute[]

  props.forEach(prop => {
    const propName = prop.name.name as string

    if (STYLE_PROPS[propName] || variants[propName]) styleProps.push(prop)
    else if (SCALE_BASEPROP_MAP[propName]) scaleProps.push(prop)
  })

  return { styleProps, scaleProps }
}

/**
 * Given a list of explicit props, returns a list of all non-style props.
 *
 * @param context
 * @param props
 *
 * @returns An object containing the `nonStyleProps`.
 */
export const notStyleProps = (
  context: PluginContext,
  props: t.JSXAttribute[]
) => {
  const { variants } = context
  const nonStyleProps = [] as t.JSXAttribute[]

  props.forEach(prop => {
    const propName = prop.name.name as string

    if (
      !STYLE_PROPS[propName] &&
      !variants[propName] &&
      SCALE_BASEPROP_MAP[propName]
    )
      nonStyleProps.push(prop)
  })

  return nonStyleProps
}

export const shouldSkipProp = (
  attrValue: null | Expression | SpreadElement | JSXEmptyExpression
) => t.isNullLiteral(attrValue)
