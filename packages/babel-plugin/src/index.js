import svgTags from 'svg-tags'
import template from 'babel-template'

import { types as t } from '@babel/core'

import {
  getSystemAst,
  getNegativeSystemAst,
  getResponsiveSystemAst,
  isNegativeExpression,
  isNegativeStringExpression,
  createMediaQuery,
} from './system'
import { DEFAULT_OPTIONS, PROPS, ALIASES, THEME_ID } from './constants'

export default (_, opts) => {
  const options = Object.assign({}, DEFAULT_OPTIONS, opts)
  const mediaQueries = options.breakpoints.map(createMediaQuery)
  const breakpoints = [null, ...mediaQueries]

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

      // Numerical Negative eg <div mx={-1} />
      if (isNegativeExpression(value)) {
        const ast = getNegativeSystemAst(key, value.argument)
        const style = t.objectProperty(id, ast)

        styles.push(style)
      } else if (isNegativeStringExpression(value)) {
        // String negative of key eg <div mx={-large} />
        const nonNegativeValue = value.value.substring(1)
        const ast = getNegativeSystemAst(key, t.stringLiteral(nonNegativeValue))
        const style = t.objectProperty(id, ast)

        styles.push(style)
      } else if (t.isCallExpression(value) || t.isIdentifier(value)) {
        // Function call or plain variable eg <div m={varName} p={negate(5)} />
        const style = t.objectProperty(id, value)

        styles.push(style)
      } else if (Array.isArray(value)) {
        // Responsive array eg <div m={[1, 2, 3]} />
        value.forEach((node, i) => {
          if (i >= breakpoints.length) return

          const media = breakpoints[i]
          const baseStyle = t.objectProperty(id, node)

          // We're dealing with the first breakpoint.
          if (!media) {
            const ast = getResponsiveSystemAst(baseStyle)
            const style = t.objectProperty(id, ast)

            return styles.push(style)
          }

          const breakpointIndex = responsiveStyles.findIndex(
            style => style.key.value === media,
          )

          if (breakpointIndex < 0) {
            const ast = getResponsiveSystemAst(baseStyle)

            const responsiveStyle = t.objectProperty(id, ast)
            const style = t.objectProperty(
              t.stringLiteral(media),
              t.objectExpression([responsiveStyle]),
            )

            responsiveStyles.push(style)
          } else {
            const ast = getResponsiveSystemAst(baseStyle)

            const responsiveStyle = t.objectProperty(id, ast)
            responsiveStyles[breakpointIndex].value.properties.push(
              responsiveStyle,
            )
          }
        })
      } else {
        // Just plain string eg => <div color='primary' />
        const ast = getSystemAst(key, value)
        const style = t.objectProperty(id, ast)

        styles.push(style)
      }
    })

    return [...styles, ...responsiveStyles]
  }

  const visitCSSProp = {
    ObjectExpression(path, state) {
      path.node.properties.unshift(...state.styles)
      path.stop()
    },
    CallExpression(path, state) {
      path.get('arguments.0').traverse(visitCSSProp, state)
    },
  }

  // Creates or merges our styles into the CSS prop.
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

      const themeCallTemplate = template(`
        ${THEME_ID} => CSS_OBJECT
      `)
      const ast = themeCallTemplate({
        CSS_OBJECT: value.node,
      })

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
