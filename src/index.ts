import { NodePath, types as t } from '@babel/core'
import * as BabelTypes from '@babel/types'
import {
  JSXExpressionContainer,
  ObjectExpression,
  JSXOpeningElement,
  Program,
} from '@babel/types'
import { DEFAULT_OPTIONS, INJECTED_PROP_NAME } from './constants'
import { mergeStyleObjects } from './mergers'
import {
  stripInternalProp,
  extractScopedProp,
  normalizeAndGroupStyles,
  responsifyStyles,
} from './utils'

export interface Babel {
  types: typeof BabelTypes
}
export type StylePropExpression = BabelTypes.Expression | null
export interface PluginOptions {
  prop: string
  psuedoClases: { [key: string]: RegExp }
  variants: {
    [key: string]: string
  }
}

const jsxOpeningElementVisitor = {
  JSXOpeningElement(path: NodePath<JSXOpeningElement>, options: PluginOptions) {
    const allProps = path.node.attributes
    if (!allProps.length) return

    const { scopedProp, existingProp } = extractScopedProp(
      allProps,
      options.prop
    )
    if (!scopedProp) return

    const groupedStyleObj = normalizeAndGroupStyles(scopedProp, options)

    // TODO: Give this a less stupid name lol
    let responsiveStyleObj = responsifyStyles(groupedStyleObj, options)

    if (existingProp) {
      const existingPropValue = existingProp.value as JSXExpressionContainer
      const existingObj = existingPropValue.expression as ObjectExpression

      responsiveStyleObj = mergeStyleObjects(existingObj, responsiveStyleObj)

      path.node.attributes = stripInternalProp(path.node.attributes)
    }

    const styleProp = t.jsxAttribute(
      t.jsxIdentifier(INJECTED_PROP_NAME),
      t.jsxExpressionContainer(responsiveStyleObj)
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
