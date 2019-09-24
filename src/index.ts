import { NodePath } from '@babel/core'
import { JSXOpeningElement, Program } from '@babel/types'
import { buildNamespacedObject } from './builders'
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
    const namespacedObject = buildNamespacedObject(
      context,
      scaleProps,
      styleProps
    )

    if (stripProps) {
      const nonStyleProps = notStyleProps(context, explicitProps)
      path.node.attributes = [...nonStyleProps, ...spreadProps]
    }

    console.log(namespacedObject)
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
