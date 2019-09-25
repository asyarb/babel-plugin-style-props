import { NodePath, types as t } from '@babel/core'
import { JSXOpeningElement, Program } from '@babel/types'
import { buildStylePropsArray } from './builders'
import { DEFAULT_OPTIONS } from './constants'
import { extractProps, extractStyleProps, notStyleProps } from './utils'

let fileHasStyleProps = false

const jsxOpeningElementVisitor = {
  JSXOpeningElement(path: NodePath<JSXOpeningElement>, options: PluginOptions) {
    const allProps = path.node.attributes
    if (!allProps.length) return

    const context = {
      scopedProps: {},
      ...options,
    }
    const { stripProps } = context

    const { explicitProps, spreadProps } = extractProps(allProps)
    const { scaleProps, styleProps } = extractStyleProps(context, explicitProps)

    if (!scaleProps.length && !styleProps.length) return

    fileHasStyleProps = true

    // build our namespaced object...
    const stylePropsArray = buildStylePropsArray(
      context,
      scaleProps,
      styleProps
    )

    if (stripProps) {
      const nonStyleProps = notStyleProps(context, explicitProps)
      path.node.attributes = [...nonStyleProps, ...spreadProps]
    }

    if (stylePropsArray) {
      const internalProp = t.jsxAttribute(
        t.jsxIdentifier('__styleProps__'),
        t.jsxExpressionContainer(stylePropsArray)
      )
      path.node.attributes.push(internalProp)
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
        exit() {
          if (fileHasStyleProps) {
            // do nothing
          }
        },
      },
    },
  }
}
