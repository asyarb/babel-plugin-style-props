import svgTags from 'svg-tags'
import { types as t } from '@babel/core'

import { defaultOptions, props, aliases, CSS_ID } from './constants'

const createMediaQuery = n => `@media screen and (min-width: ${n})`

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
        // handle mx, my, px, py, etc
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
      let val = value

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
        // This is a plain prop, just create it.
        const style = t.objectProperty(id, value)
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

  const wrapCSSProp = {
    JSXAttribute(path, state) {
      if (path.node.name.name !== 'css') return

      const value = path.get('value.expression')
      if (!value.isObjectExpression()) return
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
