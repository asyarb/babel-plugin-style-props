import { types as t } from '@babel/core'
import {
  Expression,
  JSXAttribute,
  JSXEmptyExpression,
  JSXSpreadAttribute,
  SpreadElement,
} from '@babel/types'
import { PluginOptions } from '../types'
import { PROP_NAMES, STYLE_PROPS_ID } from './constants'

/**
 * Given a value, casts the value to an array if it is not one.
 *
 * @param x
 * @returns The casted array.
 */
export const castArray = <T>(x: T | T[]) => (Array.isArray(x) ? x : [x])

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
 * @param options
 * @param props
 * @returns An object containing `styleProps` and `scaleProps`.
 */
export const extractStyleProps = (
  options: PluginOptions,
  props: t.JSXAttribute[]
) => {
  const { variants } = options
  const styleProps = [] as JSXAttribute[]
  const scaleProps = [] as JSXAttribute[]
  let existingStyleProp: JSXAttribute | undefined

  props.forEach(prop => {
    const propName = prop.name.name as string
    const isScaleProp = propName.endsWith('Scale')
    const basePropName = propName.replace('Scale', '')

    if (propName === STYLE_PROPS_ID) existingStyleProp = prop
    else if (variants[basePropName]) styleProps.push(prop)
    else if (PROP_NAMES.includes(basePropName)) {
      if (isScaleProp) scaleProps.push(prop)
      else styleProps.push(prop)
    }
  })

  return { styleProps, scaleProps, existingStyleProp }
}

/**
 * Given a list of **explicit** props, returns a list of all non-style props.
 *
 * @param options
 * @param props
 * @returns An object containing the `nonStyleProps`.
 */
export const notStyleProps = (
  options: PluginOptions,
  props: JSXAttribute[]
) => {
  const { variants } = options

  return props.filter(prop => {
    const propName = prop.name.name as string
    const basePropName = propName.replace('Scale', '')

    if (PROP_NAMES.includes(basePropName)) return false
    if (variants[propName]) return false

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
