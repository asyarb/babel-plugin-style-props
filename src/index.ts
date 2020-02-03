import { NodePath, types as t } from '@babel/core'
import * as BabelTypes from '@babel/types'
import {
  JSXExpressionContainer,
  JSXOpeningElement,
  ObjectExpression,
  Program,
} from '@babel/types'
import { buildStyleObject } from './builders'
import { DEFAULT_OPTIONS, STYLE_PROPS_ID } from './constants'
import { mergeStyleObjects } from './mergers'
import { processScaleProps } from './scaleProps'
import { processStyleProps, STYLE_PROP_TYPE } from './styleProps'
import {
  extractProps,
  extractStyleProps,
  notStyleProps,
  stripInternalProp,
} from './utils'
import { processVariantProps } from './variantProps'

export interface Babel {
  types: typeof BabelTypes
}
export type StylePropExpression = BabelTypes.Expression | null
export interface PluginOptions {
  stripProps: boolean
  variants: {
    [key: string]: string
  }
}

const jsxOpeningElementVisitor = {
  JSXOpeningElement(path: NodePath<JSXOpeningElement>, options: PluginOptions) {
    const allProps = path.node.attributes
    if (!allProps.length) return

    const { explicitProps, spreadProps } = extractProps(allProps)
    const {
      scaleProps,
      styleProps,
      hoverProps,
      focusProps,
      activeProps,
      variantProps,
      existingStyleProp,
    } = extractStyleProps(options, explicitProps)

    if (
      !scaleProps.length &&
      !styleProps.length &&
      !hoverProps.length &&
      !focusProps.length &&
      !variantProps.length &&
      !activeProps.length
    )
      return

    if (options.stripProps) {
      path.node.attributes = [
        ...notStyleProps(options, explicitProps),
        ...spreadProps,
      ]
    }

    const base = processStyleProps(styleProps, STYLE_PROP_TYPE.BASE)
    const hover = processStyleProps(hoverProps, STYLE_PROP_TYPE.HOVER)
    const focus = processStyleProps(focusProps, STYLE_PROP_TYPE.FOCUS)
    const active = processStyleProps(activeProps, STYLE_PROP_TYPE.ACTIVE)
    const variants = processVariantProps(variantProps, options)
    const scales = processScaleProps(scaleProps)

    let styleObj = buildStyleObject({
      css: [base, hover, focus, active],
      extensions: [scales, variants],
    })

    if (existingStyleProp) {
      const existingPropValue = existingStyleProp.value as JSXExpressionContainer
      const existingObj = existingPropValue.expression as ObjectExpression

      styleObj = mergeStyleObjects(existingObj, styleObj)

      path.node.attributes = stripInternalProp(path.node.attributes)
    }

    const styleProp = t.jsxAttribute(
      t.jsxIdentifier(STYLE_PROPS_ID),
      t.jsxExpressionContainer(styleObj)
    )

    path.node.attributes.push(styleProp)
  },
}

export default (_babel: Babel, opts: PluginOptions) => {
  const options = { ...DEFAULT_OPTIONS, ...opts }

  return {
    name: 'style-props',
    visitor: {
      Program: {
        enter(path: NodePath<Program>) {
          path.traverse(jsxOpeningElementVisitor, options)
        },
      },
    },
  }
}
