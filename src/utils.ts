import { types as t } from '@babel/core'
import {
  Expression,
  JSXAttribute,
  JSXEmptyExpression,
  JSXSpreadAttribute,
  SpreadElement,
} from '@babel/types'
import { PluginContext } from '../types'
import { SCALE_BASEPROP_MAP, STYLE_PROPS, STYLE_PROPS_ID } from './constants'

/**
 * Given a value, casts the value to an array if it is not one.
 *
 * @param x
 * @returns The casted array.
 */
export const castArray = <T>(x: T | T[]) => (Array.isArray(x) ? x : [x])

/**
 * Returns an array by returning the result of the provided `callback`
 * `num` times.  The callback will receive the current iteration number
 * as an arument.
 *
 * @param callback
 * @param num
 */
export const times = <T>(callback: (index: number) => T, num: number) => {
  const arr = []
  for (let i = 0; i < num; i++) {
    arr[i] = callback(i)
  }

  return arr
}

/**
 * Given a list of props, returns a list of all the explicit props, e.g. `prop="myProp"` and spread props e.g. `{...props}`.
 *
 * @param props
 * @returns An object containing `explicitProps` and `spreadProps`.
 */
export const extractProps = (props: (JSXAttribute | JSXSpreadAttribute)[]) => {
  const explicitProps = [] as JSXAttribute[]
  const spreadProps = [] as JSXSpreadAttribute[]

  props.forEach(prop => {
    if (t.isJSXSpreadAttribute(prop)) spreadProps.push(prop)
    else explicitProps.push(prop)
  })

  return { explicitProps, spreadProps }
}

/**
 * Given a list of **explicit** props, returns a list of all style props e.g. `mx=""` and scale props e.g. `mxScale=""`
 *
 * @param context
 * @param props
 * @returns An object containing `styleProps` and `scaleProps`.
 */
export const extractStyleProps = (
  context: PluginContext,
  props: t.JSXAttribute[]
) => {
  const { variants } = context
  const styleProps = [] as JSXAttribute[]
  const scaleProps = [] as JSXAttribute[]
  let existingStylePropsObj: JSXAttribute | undefined

  props.forEach(prop => {
    const propName = prop.name.name as string

    if (propName === STYLE_PROPS_ID) existingStylePropsObj = prop
    else if (STYLE_PROPS[propName] || variants[propName]) styleProps.push(prop)
    else if (SCALE_BASEPROP_MAP[propName]) scaleProps.push(prop)
  })

  return { styleProps, scaleProps, existingStylePropsObj }
}

/**
 * Given a list of **explicit** props, returns a list of all non-style props.
 *
 * @param context
 * @param props
 * @returns An object containing the `nonStyleProps`.
 */
export const notStyleProps = (
  context: PluginContext,
  props: JSXAttribute[]
) => {
  const { variants } = context

  return props.filter(prop => {
    const propName = prop.name.name as string

    if (STYLE_PROPS[propName]) return false
    if (variants[propName]) return false
    if (SCALE_BASEPROP_MAP[propName]) return false

    return true
  })
}

/**
 * Given a list of props, returns a new list with the `__styleProp__` prop removed.
 *
 * @param props
 * @returns An array with the internal prop removed.
 */
export const stripInternalProp = (
  props: (JSXAttribute | JSXSpreadAttribute)[]
) => {
  return props.filter(prop => {
    if (t.isJSXSpreadAttribute(prop)) return true
    if (t.isJSXAttribute(prop) && prop.name.name !== STYLE_PROPS_ID) return true

    return false
  })
}

/**
 * Given any prop, returns `true` if the prop should be skipped
 * for style-prop processing, `false` otherwise.
 *
 * @param prop
 */
export const shouldSkipProp = (
  prop: null | Expression | SpreadElement | JSXEmptyExpression
) => t.isNullLiteral(prop)
