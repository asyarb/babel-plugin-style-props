import svgTags from 'svg-tags'
import { types as t, traverse } from '@babel/core'

import {
  SYSTEM_PROPS,
  SYSTEM_ALIASES,
  DEFAULT_OPTIONS,
  SCALES_MAP,
  STYLING_LIBRARIES,
} from './constants'

import {
  buildUndefinedConditionalFallback,
  buildVariableDeclaration,
  buildSpreadElement,
} from './builders'

// Globals
let themeIdentifier
let themeIdentifierPath
let options
let propsToPass = {}

/**
 * Casts a provided value as an array if it is not one.
 *
 * @param {*} x - The value to cast to an array.
 * @returns The casted array.
 */
const castArray = x => (Array.isArray(x) ? x : [x])

/**
 * Returns a valid media query given a CSS unit.
 *
 * @param {*} n - The CSS unit to generate a media query from.
 * @returns The media query string.
 */
const createMediaQuery = unit => `@media screen and (min-width: ${unit})`

/**
 * Given an array of props, returns only the known system props.
 *
 * @param {Array} attrs - Props to filter.
 * @returns The array of system props.
 */
const onlySystemProps = attrs =>
  attrs.filter(attr =>
    Boolean(SYSTEM_PROPS[attr.name.name] || options.variants[attr.name.name]),
  )

/**
 * Given an array of props, returns only non-system props.
 *
 * @param {Array} attrs - Props to filter.
 * @returns The array of non-system props.
 */
const notSystemProps = attrs =>
  attrs.filter(
    attr =>
      !Boolean(
        SYSTEM_PROPS[attr.name.name] || options.variants[attr.name.name],
      ),
  )

/**
 * Strips and returns the base value of a negative babel AST.
 *
 * @param {Object} attrValue - babel ast node to strip.
 * @returns A tuple containing the base value and a boolean
 * indicating if the value was negative.
 */
const stripNegativeFromAttrValue = attrValue => {
  const isNegative =
    (t.isUnaryExpression(attrValue) && attrValue.operator === '-') ||
    (t.isStringLiteral(attrValue) && attrValue.value[0] === '-')

  let baseAttrValue = attrValue

  if (isNegative && t.isUnaryExpression(attrValue))
    baseAttrValue = attrValue.argument
  if (isNegative && t.isStringLiteral(attrValue))
    baseAttrValue = t.stringLiteral(attrValue.value.substring(1))

  return [baseAttrValue, isNegative]
}

const attrToThemeExpression = (
  propName,
  attrValue,
  {
    withUndefinedFallback = true,
    withNegativeTransform = true,
    mediaIndex = 0,
  } = {},
) => {
  const scaleName = SCALES_MAP[propName] || options.variants[propName]
  if (!scaleName) return attrValue

  const [attrBaseValue, isNegative] = stripNegativeFromAttrValue(attrValue)
  let stylingLibraryAttrValue = attrBaseValue // emotion

  if (options.stylingLibrary === 'styled-components' && propsToPass[propName])
    stylingLibraryAttrValue = t.memberExpression(
      t.memberExpression(
        t.memberExpression(t.identifier('p'), t.identifier('__styleProps')),
        t.identifier(propName),
      ),
      t.numericLiteral(mediaIndex),
      true,
    )

  let themeExpression = t.memberExpression(
    t.memberExpression(
      t.identifier(themeIdentifierPath),
      t.stringLiteral(scaleName),
      true,
    ),
    stylingLibraryAttrValue,
    true,
  )

  if (withUndefinedFallback)
    themeExpression = buildUndefinedConditionalFallback(
      themeExpression,
      stylingLibraryAttrValue,
    )

  if (withNegativeTransform && isNegative)
    themeExpression = t.binaryExpression(
      '+',
      t.stringLiteral('-'),
      t.parenthesizedExpression(themeExpression),
    )

  return themeExpression
}

const shouldSkipProp = attrValue => t.isNullLiteral(attrValue)

const preprocessProp = (propName, attrValue) => {
  // Process negative values

  propsToPass[propName] = propsToPass[propName] || []
  propsToPass[propName].push(attrValue)
}

const buildCssObjectProp = (propName, attrValue, { mediaIndex = 0 } = {}) => {
  return t.objectProperty(
    t.identifier(propName),
    attrToThemeExpression(propName, attrValue, { mediaIndex }),
  )
}

const buildCssObjectProperties = (attrNodes, breakpoints) => {
  const baseResult = []
  const responsiveResults = []

  attrNodes.forEach(attrNode => {
    const attrName = attrNode.name.name
    const attrValue = attrNode.value
    const cssPropertyNames = castArray(SYSTEM_ALIASES[attrName] || attrName)

    if (t.isJSXExpressionContainer(attrValue)) {
      const expression = attrValue.expression

      if (t.isArrayExpression(expression)) {
        // e.g. prop={['test', null, 'test2']}
        expression.elements.forEach((element, i) => {
          responsiveResults[i] = responsiveResults[i] || []

          const resultArr = i === 0 ? baseResult : responsiveResults[i - 1]

          cssPropertyNames.forEach(cssPropertyName => {
            preprocessProp(cssPropertyName, element)

            if (shouldSkipProp(element)) return

            resultArr.push(
              buildCssObjectProp(cssPropertyName, element, { mediaIndex: i }),
            )
          })
        })
      } else {
        // e.g. prop={bool ? 'foo' : "test"}
        // e.g. prop={'test'}
        // e.g. prop={test}
        cssPropertyNames.forEach(cssPropertyName => {
          preprocessProp(cssPropertyName, expression)

          if (shouldSkipProp(expression)) return

          baseResult.push(buildCssObjectProp(cssPropertyName, expression))
        })
      }
    } else {
      const isVariant = Boolean(options.variants[attrNode.name.name])

      // e.g. prop="test"
      cssPropertyNames.forEach(cssPropertyName => {
        preprocessProp(cssPropertyName, attrValue)

        if (shouldSkipProp(attrValue)) return

        if (isVariant)
          baseResult.push(
            buildSpreadElement(
              attrToThemeExpression(cssPropertyName, attrValue, {
                withUndefinedFallback: false,
                withNegativeTransform: false,
              }),
            ),
          )
        else baseResult.push(buildCssObjectProp(cssPropertyName, attrValue))
      })
    }
  })

  const keyedResponsiveResults = responsiveResults
    .filter(x => x.length)
    .map((objectPropertiesForBreakpoint, i) => {
      const mediaQuery = createMediaQuery(breakpoints[i])

      return t.objectProperty(
        t.stringLiteral(mediaQuery),
        t.objectExpression(objectPropertiesForBreakpoint),
      )
    })

  return [...baseResult, ...keyedResponsiveResults]
}

const buildCssAttr = objectProperties =>
  t.jsxAttribute(
    t.jSXIdentifier('css'),
    t.jSXExpressionContainer(
      t.arrowFunctionExpression(
        [t.identifier(themeIdentifier)],
        t.objectExpression(objectProperties),
      ),
    ),
  )

const extractAndCleanFunctionParts = expression => {
  const functionBody = expression.body
  const functionParam = expression.params[0]
  let bodyStatements = []

  if (t.isIdentifier(functionParam)) {
    // e.g. css={theme => }
    traverse(
      functionBody,
      {
        Identifier(path, exisitingParamName) {
          if (path.node.name === exisitingParamName) {
            path.node.name = themeIdentifier
          }
        },
      },
      expression,
      functionParam.name,
    )
  } else if (t.isObjectPattern(functionParam)) {
    // e.g. css={({ colors, theme }) => }
    bodyStatements = [
      buildVariableDeclaration(
        'const',
        functionParam,
        t.identifier(themeIdentifier),
      ),
    ]
  }

  if (t.isObjectExpression(functionBody)) {
    // e.g. css={theme => ({ ... })}
    return [bodyStatements, functionBody.properties]
  } else if (t.isBlockStatement(functionBody)) {
    // e.g. css={theme => { return { ... } }}
    const exisitingBodyStatements = functionBody.body.filter(
      node => !t.isReturnStatement(node),
    )
    const returnStatement = functionBody.body.find(node =>
      t.isReturnStatement(node),
    )

    bodyStatements = [...bodyStatements, ...exisitingBodyStatements]

    // throw error if returnStatement.argument is not an object.
    return [bodyStatements, returnStatement.argument.properties]
  }
}

const buildMergedCssAttr = (objectProperties, existingCssAttr) => {
  const existingExpression = existingCssAttr.value.expression
  let mergedProperties = []
  let bodyStatements = []

  if (t.isObjectExpression(existingExpression))
    mergedProperties = [...objectProperties, ...existingExpression.properties]
  else if (t.isFunction(existingExpression)) {
    const [
      extractedBodyStatements,
      returnObjectProperties,
    ] = extractAndCleanFunctionParts(existingExpression)

    bodyStatements = extractedBodyStatements
    mergedProperties = [...objectProperties, ...returnObjectProperties]
  }

  const hasBodyStatements = bodyStatements.length

  return t.jsxAttribute(
    t.jSXIdentifier('css'),
    t.jSXExpressionContainer(
      t.arrowFunctionExpression(
        [t.identifier(themeIdentifier)],
        hasBodyStatements
          ? t.blockStatement([
              ...bodyStatements,
              t.returnStatement(t.objectExpression(mergedProperties)),
            ])
          : t.objectExpression(mergedProperties),
      ),
    ),
  )
}

const jsxOpeningElementVisitor = {
  JSXOpeningElement(path) {
    const name = path.node.name.name
    if (svgTags.includes(name)) return

    // Props to pass to createElement
    propsToPass = []

    const systemProps = onlySystemProps(path.node.attributes)
    const cssObjectProperties = buildCssObjectProperties(
      systemProps,
      options.breakpoints,
    )

    if (!cssObjectProperties.length) return

    const existingCssAttr = path.node.attributes.find(
      attr => attr.name.name === 'css',
    )

    let newCssAttr
    if (existingCssAttr)
      newCssAttr = buildMergedCssAttr(cssObjectProperties, existingCssAttr)
    else newCssAttr = buildCssAttr(cssObjectProperties)

    path.node.attributes = notSystemProps(path.node.attributes).filter(
      attr => attr.name.name !== 'css',
    )
    if (newCssAttr) path.node.attributes.push(newCssAttr)

    const internalProps = Object.entries(propsToPass).map(([propName, attrs]) =>
      t.objectProperty(t.identifier(propName), t.arrayExpression(attrs)),
    )

    if (options.stylingLibrary === 'styled-components' && internalProps.length)
      path.node.attributes.push(
        t.jsxAttribute(
          t.jsxIdentifier('__styleProps'),
          t.jsxExpressionContainer(t.objectExpression(internalProps)),
        ),
      )
  },
}

export default (_, opts) => {
  options = { ...DEFAULT_OPTIONS, ...opts }

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

  return {
    name: 'styled-system',
    visitor: {
      Program(path) {
        path.traverse(jsxOpeningElementVisitor)
      },
    },
  }
}
