import { NodePath, types as t } from '@babel/core'
import {
  JSXExpressionContainer,
  JSXOpeningElement,
  ObjectExpression,
  Program,
} from '@babel/types'
import { buildObjectProperty, mergeStyleObjects } from 'builders'
import { Babel, PluginOptions } from '../types'
import { DEFAULT_OPTIONS, STYLE_PROPS_ID } from './constants'
import { processScaleProps } from './scaleProps'
import { processStyleProps } from './styleProps'
import { extractProps, extractStyleProps, notStyleProps } from './utils'

const jsxOpeningElementVisitor = {
  JSXOpeningElement(path: NodePath<JSXOpeningElement>, options: PluginOptions) {
    const allProps = path.node.attributes
    if (!allProps.length) return

    const { explicitProps, spreadProps } = extractProps(allProps)
    const { scaleProps, styleProps, existingStyleProp } = extractStyleProps(
      options,
      explicitProps
    )

    if (!scaleProps.length && !styleProps.length) return

    if (options.stripProps) {
      path.node.attributes = [
        ...notStyleProps(options, explicitProps),
        ...spreadProps,
      ]
    }

    const base = processStyleProps(options, styleProps)
    const scales = processScaleProps(scaleProps)

    const css = buildObjectProperty('css', t.objectExpression([base]))
    const extensions = buildObjectProperty(
      'extensions',
      t.objectExpression([scales])
    )

    const styleObj = t.objectExpression([css, extensions])

    if (existingStyleProp) {
      const existingPropValue = existingStyleProp.value as JSXExpressionContainer
      const existingObj = existingPropValue.expression as ObjectExpression

      mergeStyleObjects(existingObj, styleObj)
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
