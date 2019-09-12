import { types as t } from '@babel/core'

import {
  DEFAULT_OPTIONS,
  STYLING_LIBRARIES,
  INTERNAL_PROP_ID,
} from './constants'
import { onlySystemProps, notSystemProps } from './utils'
import {
  buildCssObjectProperties,
  buildCssAttr,
  buildMergedCssAttr,
} from './builders'

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
    const context = {
      propsToPass: {},
      ...optionsContext,
    }
    const { breakpoints, propsToPass, stylingLibrary } = context

    // All props on this JSX Element
    const nodeAttrs = path.node.attributes

    const systemProps = onlySystemProps(context, nodeAttrs)
    const cssObjectProperties = buildCssObjectProperties(
      context,
      systemProps,
      breakpoints,
    )

    if (!cssObjectProperties.length) return

    const existingCssAttr = nodeAttrs.find(attr => attr.name.name === 'css')
    const newCssAttr = existingCssAttr
      ? buildMergedCssAttr(context, cssObjectProperties, existingCssAttr)
      : buildCssAttr(context, cssObjectProperties)

    // Remove the existing `css` prop, if there is one.
    path.node.attributes = notSystemProps(context, nodeAttrs).filter(
      attr => attr.name.name !== 'css',
    )

    // Add our new `css` prop.
    if (newCssAttr) path.node.attributes.push(newCssAttr)

    // For styled-components, we need to pass any runtime identifiers as props to
    // the `styled.div` that their babel plugin generates. This is because the
    // `styled.div` is generated outside the scope of this JSX element.
    const internalProps = Object.entries(propsToPass).map(([propName, attrs]) =>
      t.objectProperty(t.identifier(propName), t.arrayExpression(attrs)),
    )
    if (stylingLibrary === 'styled-components' && internalProps.length)
      path.node.attributes.push(
        t.jsxAttribute(
          t.jsxIdentifier(INTERNAL_PROP_ID),
          t.jsxExpressionContainer(t.objectExpression(internalProps)),
        ),
      )
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
    name: 'style-props',
    visitor: {
      Program(path) {
        path.traverse(jsxOpeningElementVisitor, { optionsContext })
      },
    },
  }
}
