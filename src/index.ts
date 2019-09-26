import { NodePath, types as t } from '@babel/core'
import {
  ArrayExpression,
  JSXExpressionContainer,
  JSXOpeningElement,
  Program,
} from '@babel/types'
import { Babel, PluginOptions } from '../types'
import {
  buildStylePropsArrayExpression,
  mergeStylePropArrayExpressions,
} from './builders'
import { DEFAULT_OPTIONS, STYLE_PROPS_ID } from './constants'
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

    const context = {
      scopedProps: {},
      ...options,
    }

    const { explicitProps, spreadProps } = extractProps(allProps)
    const { scaleProps, styleProps, existingStylePropsObj } = extractStyleProps(
      context,
      explicitProps
    )

    if (!scaleProps.length && !styleProps.length) return

    const stylePropsArrayExpression = buildStylePropsArrayExpression(
      context,
      scaleProps,
      styleProps
    )

    if (context.stripProps) {
      path.node.attributes = [
        ...notStyleProps(context, explicitProps),
        ...spreadProps,
      ]
    }

    if (stylePropsArrayExpression) {
      let stylePropValue = stylePropsArrayExpression

      if (existingStylePropsObj) {
        path.node.attributes = stripInternalProp(path.node.attributes)

        const existingContainer = existingStylePropsObj.value as JSXExpressionContainer
        const existingArrayExpression = existingContainer.expression as ArrayExpression

        stylePropValue = mergeStylePropArrayExpressions(
          stylePropsArrayExpression,
          existingArrayExpression
        )
      }

      const styleProp = t.jsxAttribute(
        t.jsxIdentifier(STYLE_PROPS_ID),
        t.jsxExpressionContainer(stylePropValue)
      )

      path.node.attributes.push(styleProp)
    }
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
