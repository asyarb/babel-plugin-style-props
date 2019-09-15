import { types as t } from '@babel/core'

import {
  DEFAULT_OPTIONS,
  STYLING_LIBRARIES,
  INTERNAL_PROP_ID,
} from './constants'
import { onlyStyleProps, onlyScaleProps, notStyleProps } from './utils'
import {
  buildCssObjectProperties,
  buildCssAttr,
  buildMergedCssAttr,
} from './builders'

const processScaleProps = path => {
  const scaleAttrs = onlyScaleProps(path.node.attributes)
}

/**
 * Primary visitor. Visits all JSX components transpiles any system
 * props to a theme aware `css` prop. If an `css` prop already exists,
 * merges the result.
 *
 * If `stylingLibrary` was set to `styled-components`, also passes the list
 * of runtime identifiers and expressions needed to appropriately scope them
 * to the generated `styled.div`, etc.
 */
const jsxOpeningElementVisitor = {
  JSXOpeningElement(path, { optionsContext }) {
    const allAttrs = path.node.attributes
    if (!allAttrs.length) return

    const context = {
      propsToPass: {},
      ...optionsContext,
    }
    const { breakpoints, propsToPass, stylingLibrary } = context

    processScaleProps(path)

    const spreadAttrs = allAttrs.filter(attr => t.isJSXSpreadAttribute(attr)) // e.g. {...props}
    const explicitAttrs = allAttrs.filter(attr => !t.isJSXSpreadAttribute(attr)) // e.g. prop={value}

    const styleProps = onlyStyleProps(context, explicitAttrs)
    if (!styleProps.length) return

    const cssObjectProperties = buildCssObjectProperties(
      context,
      styleProps,
      breakpoints,
    )

    const existingCssAttr = explicitAttrs.find(attr => attr.name.name === 'css')
    const newCssAttr = existingCssAttr
      ? buildMergedCssAttr(context, cssObjectProperties, existingCssAttr)
      : buildCssAttr(context, cssObjectProperties)

    // Remove the existing `css` prop, if there is one.
    path.node.attributes = notStyleProps(context, explicitAttrs).filter(
      attr => attr.name.name !== 'css',
    )

    // Add our new `css` prop.
    if (newCssAttr) path.node.attributes.push(newCssAttr)

    // Add back our spread attributes.
    spreadAttrs.forEach(attr => path.node.attributes.push(attr))

    // For styled-components, we need to pass any runtime identifiers as props to
    // the `styled.div` that their babel plugin generates. This is because the
    // `styled.div` is generated outside the scope of this JSX element.
    const internalProps = Object.entries(propsToPass).map(([propName, attrs]) =>
      t.objectProperty(t.identifier(propName), t.arrayExpression(attrs)),
    )
    if (stylingLibrary === 'styled-components' && internalProps.length) {
      path.node.attributes.push(
        t.jsxAttribute(
          t.jsxIdentifier(INTERNAL_PROP_ID),
          t.jsxExpressionContainer(t.objectExpression(internalProps)),
        ),
      )
    }
  },
}

export default (_, opts) => {
  const options = { ...DEFAULT_OPTIONS, ...opts }
  let themeIdentifier
  let themeIdentifierPath

  switch (options.stylingLibrary) {
    case 'styled-components':
      themeIdentifier = STYLING_LIBRARIES.styledComponents.identifier
      themeIdentifierPath = STYLING_LIBRARIES.styledComponents.identifierPath
      break

    case 'emotion':
      themeIdentifier = STYLING_LIBRARIES.emotion.identifier
      themeIdentifierPath = STYLING_LIBRARIES.emotion.identifierPath
      break

    default:
      throw new Error(
        '`stylingLibrary` must be either "emotion" or "styled-components"',
      )
  }

  const optionsContext = {
    themeIdentifier,
    themeIdentifierPath,
    ...options,
  }

  return {
    name: 'styled-props',
    visitor: {
      Program(path) {
        path.traverse(jsxOpeningElementVisitor, { optionsContext })
      },
    },
  }
}
