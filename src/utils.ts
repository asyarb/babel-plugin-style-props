import { types as t } from '@babel/core'
import {
  Expression,
  JSXAttribute,
  JSXEmptyExpression,
  JSXSpreadAttribute,
  SpreadElement,
} from '@babel/types'

import { PluginOptions } from './'
import { PROP_NAMES, STYLE_PROPS_ID } from './constants'

/**
 * Given a value, casts the value to an array if it is not one.
 *
 * @param x - The value to cast to an array.
 *
 * @returns The casted array.
 */
export const castArray = <T>(x: T | T[]) => (Array.isArray(x) ? x : [x])

/**
 * Given a prop's name, extracts the base name of the prop.
 *
 * @example `extractPropBaseName('mxScale') => `mx``
 *
 * @param propName - Prop name to extract the base name from.
 *
 * @returns The base prop name.
 */
export const extractPropBaseName = (propName: string) => {
  let propBaseName = propName
  let isScale = false
  let isHover = false
  let isFocus = false
  let isActive = false

  if (propName.endsWith('Scale')) {
    propBaseName = propName.replace('Scale', '')
    isScale = true
  } else if (propName.endsWith('Hover')) {
    propBaseName = propName.replace('Hover', '')
    isHover = true
  } else if (propName.endsWith('Focus')) {
    propBaseName = propName.replace('Focus', '')
    isFocus = true
  } else if (propName.endsWith('Active')) {
    propBaseName = propName.replace('Active', '')
    isActive = true
  }

  return { propBaseName, isScale, isHover, isFocus, isActive }
}

/**
 * Given a list of props, returns a list of all the explicit props, e.g. `prop="myProp"` and spread props e.g. `{...props}`.
 *
 * @param props - A list of props from a JSXElement.
 *
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
 * @param options - The babel plugin options.
 * @param props - List of props to extract from.
 *
 * @returns An object containing `styleProps` and `scaleProps`.
 */
export const extractStyleProps = (
  options: PluginOptions,
  props: JSXAttribute[]
) => {
  const { variants } = options
  let existingStyleProp: JSXAttribute | undefined

  const styleProps = [] as JSXAttribute[]
  const scaleProps = [] as JSXAttribute[]
  const hoverProps = [] as JSXAttribute[]
  const focusProps = [] as JSXAttribute[]
  const activeProps = [] as JSXAttribute[]
  const variantProps = [] as JSXAttribute[]

  props.forEach(prop => {
    const propName = prop.name.name as string
    const {
      propBaseName,
      isScale,
      isHover,
      isFocus,
      isActive,
    } = extractPropBaseName(propName)

    if (propName === STYLE_PROPS_ID) existingStyleProp = prop
    else if (variants[propBaseName]) variantProps.push(prop)
    else if (PROP_NAMES.includes(propBaseName)) {
      if (isScale) scaleProps.push(prop)
      else if (isHover) hoverProps.push(prop)
      else if (isFocus) focusProps.push(prop)
      else if (isActive) activeProps.push(prop)
      else styleProps.push(prop)
    }
  })

  return {
    styleProps,
    scaleProps,
    hoverProps,
    focusProps,
    activeProps,
    variantProps,
    existingStyleProp,
  }
}

/**
 * Given a list of **explicit** props, returns a list of all non-style props.
 *
 * @param options - The babel plugin options.
 * @param props - The list of props to extract non-style props from.
 *
 * @returns An object containing the `nonStyleProps`.
 */
export const notStyleProps = (
  options: PluginOptions,
  props: JSXAttribute[]
) => {
  const { variants } = options

  return props.filter(prop => {
    const propName = prop.name.name as string
    const { propBaseName } = extractPropBaseName(propName)

    if (PROP_NAMES.includes(propBaseName)) return false
    if (variants[propName]) return false

    return true
  })
}

/**
 * Given a list of props, returns a new list with the `__styleProp__` prop removed.
 *
 * @param props - The list of props to filter.
 *
 * @returns An array with the internal styleProp prop removed.
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
