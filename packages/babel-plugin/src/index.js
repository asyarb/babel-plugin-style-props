import svgTags from 'svg-tags'
import { types as t } from '@babel/core'

import {
  getSystemAst,
  getCSSInJSIdentifierAst,
  createMediaQuery,
} from './system'
import { DEFAULT_OPTIONS, PROPS, ALIASES, EMOTION_ID } from './constants'

export default (_, opts) => {
  const options = Object.assign({}, DEFAULT_OPTIONS, opts)
  const mediaQueries = options.breakpoints.map(createMediaQuery)
  const breakpoints = [null, ...mediaQueries]

  if (
    (!options.emotion && !options['styled-components']) ||
    (options.emotion && options['styled-components'])
  )
    throw new Error(
      'Please provide either "emotion" or "styled-components" in your babel config.',
    )

  const solution = options.emotion ? 'emotion' : 'styled-components'

  // Build up our state with all key-value pairs of system props.
  const visitSystemProps = {
    JSXAttribute(path, state) {
      const name = path.node.name.name

      // If this prop isn't one of our known props or is the
      // `css` prop, let's not do anything.
      if (!PROPS[name]) return
      if (name === 'css') return

      const key = ALIASES[name] || name
      let value = path.node.value

      if (t.isJSXExpressionContainer(path.node.value)) {
        value = path.node.value.expression

        if (t.isArrayExpression(value)) value = value.elements
      }

      if (Array.isArray(key)) {
        // Handle mx, my, px, py, etc
        key.forEach(k => state.props.push({ key: k, value }))
      } else {
        state.props.push({ key, value })
      }

      path.remove()
    },
  }

  // Convert our system props to a CSS object.
  const createStyleObject = props => {
    const styles = []
    const responsiveStyles = []

    props.forEach(({ key, value }) => {
      const id = t.identifier(key)

      if (t.isCallExpression(value) || t.isIdentifier(value)) {
        styles.push(t.objectProperty(id, value))
      } else if (Array.isArray(value)) {
        value.forEach((node, i) => {
          if (i >= breakpoints.length) return

          const media = breakpoints[i]

          // We're dealing with the first breakpoint.
          if (!media) {
            const ast = getSystemAst(key, node, solution)
            const style = t.objectProperty(id, ast)

            return styles.push(style)
          }

          const breakpointIndex = responsiveStyles.findIndex(
            style => style.key.value === media,
          )

          if (breakpointIndex < 0) {
            const ast = getSystemAst(key, node, solution)

            const responsiveStyle = t.objectProperty(id, ast)
            const style = t.objectProperty(
              t.stringLiteral(media),
              t.objectExpression([responsiveStyle]),
            )

            responsiveStyles.push(style)
          } else {
            const ast = getSystemAst(key, node, solution)

            const responsiveStyle = t.objectProperty(id, ast)
            responsiveStyles[breakpointIndex].value.properties.push(
              responsiveStyle,
            )
          }
        })
      } else {
        const ast = getSystemAst(key, value, solution)
        styles.push(t.objectProperty(id, ast))
      }
    })

    return [...styles, ...responsiveStyles]
  }

  // Visitor that renames identifiers to our constant theme
  // identifier.
  const updateCSSPropParams = {
    Identifier(path, state) {
      if (path.node.name === state.currParamName) path.node.name = EMOTION_ID // TODO: support SC
    },
  }

  // Recursively renames existing CSS prop parameters from an
  // existing CSS prop function to match our known properties.
  const visitCSSPropFunction = path => {
    const paramNode = path.node.params[0]
    const nodeBody = path.node.body
    const destructuredProps = paramNode?.properties ?? []
    const declarations = destructuredProps.map(prop =>
      t.variableDeclaration('const', [
        t.variableDeclarator(
          t.assignmentPattern(
            t.identifier(prop.key.name),
            t.memberExpression(
              getCSSInJSIdentifierAst(solution),
              t.identifier(prop.key.name),
            ),
          ),
        ),
      ]),
    )

    if (t.isObjectPattern(paramNode)) {
      // Has desctructured identifier properties
      if (t.isBlockStatement(nodeBody)) {
        // Has explicit return statement, so just prepend our declarations.
        path.node.body = t.blockStatement([...declarations, ...nodeBody.body])
      } else if (t.isObjectExpression(nodeBody)) {
        // Has implicit return
        const cssObjNode = path.node.body

        path.node.body = t.blockStatement([
          ...declarations,
          t.returnStatement(cssObjNode),
        ])
      }
    } else if (t.isIdentifier(paramNode)) {
      // Has a named param identifier
      const currParamName = paramNode.name
      path.traverse(updateCSSPropParams, { currParamName })
    }

    // Always replace params with the constant theme identifier.
    path.node.params[0] = getCSSInJSIdentifierAst(solution)
  }

  // Visit an existing CSS prop to merge our existing styles we built.
  const visitCSSProp = {
    ObjectExpression(path, state) {
      path.node.properties.unshift(...state.styles)
      path.stop()
    },
    FunctionExpression(path) {
      visitCSSPropFunction(path)
    },
    ArrowFunctionExpression(path) {
      visitCSSPropFunction(path)
    },
  }

  // Creates the final CSS prop.
  const applyCSSProp = (path, state) => {
    // Read our props from state from visitSystemProps() and create our css object.
    const styles = createStyleObject(state.props)
    if (!styles.length) return

    const cssIndex = path.node.attributes
      .filter(attr => t.isJSXAttribute(attr))
      .findIndex(attr => attr.name && attr.name.name === 'css')

    // There is no current CSS prop, so we need to create it.
    if (cssIndex < 0) {
      const cssAttribute = t.jSXAttribute(
        t.jSXIdentifier('css'),
        t.jSXExpressionContainer(t.objectExpression(styles)),
      )
      path.node.attributes.push(cssAttribute)
    } else {
      // There is a CSS prop, so we need to visit it and merge the styles we made.
      path
        .get(`attributes.${cssIndex}.value`)
        .traverse(visitCSSProp, { styles })
    }
  }

  // Wraps the CSS prop with a function that receives the theme from context as an argument.
  const wrapCSSProp = {
    JSXAttribute(path) {
      if (path.node.name.name !== 'css') return

      const value = path.get('value.expression')
      if (!value.isObjectExpression()) return

      const ast = t.arrowFunctionExpression(
        [getCSSInJSIdentifierAst(solution)],
        value.node,
      )

      value.replaceWith(ast)
    },
  }

  return {
    name: 'styled-system',
    visitor: {
      Program: {
        exit(path, state) {
          if (!state.get('isJSX')) return
        },
      },
      JSXOpeningElement(path, state) {
        const name = path.node.name.name
        if (svgTags.includes(name)) return

        state.elementName = name
        state.props = []

        path.traverse(visitSystemProps, state)
        applyCSSProp(path, state)
        path.traverse(wrapCSSProp)

        state.set('isJSX', true)
      },
    },
  }
}
