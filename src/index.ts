import { NodePath, types as t } from '@babel/core'
import * as BabelTypes from '@babel/types'
import { JSXOpeningElement, Program } from '@babel/types'
import { DEFAULT_OPTIONS, INJECTED_PROP_NAME } from './constants'
import {
  extractInternalProps,
  normalizeAndGroupStyles,
  responsifyStyles,
  buildFinalObjectExp,
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

    const { scopedProp, existingProp } = extractInternalProps(allProps, options)
    if (!scopedProp) return

    const groupedStyleObj = normalizeAndGroupStyles(scopedProp, options)
    let responsiveStyleObj = responsifyStyles(groupedStyleObj)
    const finalObject = buildFinalObjectExp(responsiveStyleObj)

    const styleProp = t.jsxAttribute(
      t.jsxIdentifier(INJECTED_PROP_NAME),
      t.jsxExpressionContainer(finalObject)
    )

    path.node.attributes.push(styleProp)

    // if (existingProp) {
    //   const existingPropValue = existingProp.value as JSXExpressionContainer
    //   const existingObj = existingPropValue.expression as ObjectExpression

    //   responsiveStyleObj = mergeInjectableObjects(existingObj, responsiveStyleObj)
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
