import { NodePath, types as t } from '@babel/core'
import { JSXOpeningElement, Program, Expression } from '@babel/types'

import { DEFAULT_OPTIONS, INJECTED_PROP_NAME } from './constants'
import {
  extractInternalProps,
  normalizeStyleNames,
  createKeyedResponsiveStyles,
} from './utils'
import { buildInjectableProp } from './builders'

export type StylePropExpression = Expression | null
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

    const scopedProp = extractInternalProps(allProps, options)
    if (!scopedProp) return

    const normalizedStyles = normalizeStyleNames(scopedProp, options)
    const responsiveStyles = createKeyedResponsiveStyles(normalizedStyles)
    const injectableExpression = buildInjectableProp(responsiveStyles)

    const styleProp = t.jsxAttribute(
      t.jsxIdentifier(INJECTED_PROP_NAME),
      t.jsxExpressionContainer(injectableExpression)
    )

    path.node.attributes.push(styleProp)
  },
}

export default (_babel: object, opts: PluginOptions) => {
  const options = { ...DEFAULT_OPTIONS, ...opts }
  options.psuedoClases.scales = /Scale$/

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
