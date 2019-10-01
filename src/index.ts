import { NodePath, types as t } from '@babel/core'
import {
  JSXExpressionContainer,
  JSXOpeningElement,
  ObjectExpression,
  Program,
} from '@babel/types'
import { Babel, PluginOptions } from '../types'
import { buildStyleObject } from './builders'
import { DEFAULT_OPTIONS, STYLE_PROPS_ID } from './constants'
import { mergeStyleObjects } from './mergers'
import { processScaleProps } from './scaleProps'
import { processStyleProps } from './styleProps'
import {
  extractProps,
  extractStyleProps,
  notStyleProps,
  stripInternalProp,
} from './utils'

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
      existingStyleProp,
    } = extractStyleProps(options, explicitProps)

    if (
      !scaleProps.length &&
      !styleProps.length &&
      !hoverProps.length &&
      !focusProps.length &&
      !activeProps.length
    )
      return

    if (options.stripProps) {
      path.node.attributes = [
        ...notStyleProps(options, explicitProps),
        ...spreadProps,
      ]
    }

    const base = processStyleProps(styleProps, options, 'base')
    const hover = processStyleProps(hoverProps, options, 'hover')
    const focus = processStyleProps(focusProps, options, 'focus')
    const active = processStyleProps(activeProps, options, 'active')
    const scales = processScaleProps(scaleProps)

    let styleObj = buildStyleObject({
      css: [base, hover, focus, active],
      extensions: [scales],
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
