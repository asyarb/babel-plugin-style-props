import svgTags from 'svg-tags'
import template from 'babel-template'

import { types as t } from '@babel/core'

import { getThemeKey } from './system'
import { defaultOptions, props, aliases } from './constants'

const createMediaQuery = n => `@media screen and (min-width: ${n})`

const checkCSSUnits = value =>
  value.match(
    /(\d*\.?\d+)\s?(px|em|ex|%|in|cn|mm|pt|pc|vh|vw|vmax|vmin|ch|rem+)/gim,
  )

const getSystemAst = (key, node) => {
  const themeKey = getThemeKey(key)
  const value = node.value

  // There is no corresponding theme scale for this, so just return the node.
  if (!themeKey) return node
  // There is a value with a unit, so they likely want an explicit, non-theme value.
  if (checkCSSUnits(value)) return node

  // There is a scale, and the value is nested. eg. theme.scale.property['something']
  if (value.includes('.')) {
    const values = value.split('.')

    return t.memberExpression(
      t.memberExpression(
        t.memberExpression(t.identifier('theme'), t.identifier(themeKey)),
        t.identifier(values[0]),
      ),
      t.stringLiteral(values[1]),
      true,
    )
  } else {
    // There is a scale, and the value is a direct theme.scale.property access
    return t.memberExpression(
      t.memberExpression(t.identifier('theme'), t.identifier(themeKey)),
      t.identifier(value),
    )
  }
}

module.exports = (_, opts) => {
  const options = Object.assign({}, defaultOptions, opts)
  const mediaQueries = options.breakpoints.map(createMediaQuery)
  const breakpoints = [null, ...mediaQueries]

  // Build up Babel's state with all of key value system props.
  const visitSystemProps = {
    JSXAttribute(path, state) {
      const name = path.node.name.name

      // If this prop isn't one of our known props or is the
      // `css` prop, let's not do anything.
      if (!props[name]) return
      if (name === 'css') return

      const key = aliases[name] || name
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
  const createStyles = props => {
    const styles = []
    const responsiveStyles = []

    props.forEach(({ key, value }) => {
      const id = t.identifier(key)
      const val = value

      // This prop is a responsive prop, so we need
      // to create the appropriate media queries.
      if (Array.isArray(val)) {
        val.forEach((node, i) => {
          if (i >= breakpoints.length) return

          const media = breakpoints[i]
          let style = t.objectProperty(id, node)

          if (!media) return styles.push(style)

          const breakpointIndex = responsiveStyles.findIndex(
            style => style.key.value === media,
          )

          if (breakpointIndex < 0) {
            style = t.objectProperty(
              t.stringLiteral(media),
              t.objectExpression([style]),
            )
            responsiveStyles.push(style)
          } else {
            responsiveStyles[breakpointIndex].value.properties.push(style)
          }
        })
      } else {
        // Convert this value to a theme value, e.g. 'gray.40' => theme.colors.gray['40']
        const ast = getSystemAst(key, value)

        // This is a plain prop, just create it.
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
    const styles = createStyles(state.props)
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
    JSXAttribute(path, state) {
      if (path.node.name.name !== 'css') return

      const value = path.get('value.expression')
      if (!value.isObjectExpression()) return

      const themeCallTemplate = template(`
        theme => CSS_OBJECT
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

        // Find all of our system props
        path.traverse(visitSystemProps, state)

        applyCSSProp(path, state)

        path.traverse(wrapCSSProp, state)
        state.set('isJSX', true)
      },
    },
  }
}
