import svgTags from 'svg-tags'
import { types as t, traverse } from '@babel/core'

import {
  SYSTEM_PROPS,
  SYSTEM_ALIASES,
  DEFAULT_OPTIONS,
  SCALES_MAP,
  IDENTIFIERS,
} from './constants'

let themeIdentifier

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
  attrs.filter(attr => Boolean(SYSTEM_PROPS[attr.name.name]))

/**
 * Given an array of props, returns only non-system props.
 *
 * @param {Array} attrs - Props to filter.
 * @returns The array of non-system props.
 */
const notSystemProps = attrs =>
  attrs.filter(attr => !Boolean(SYSTEM_PROPS[attr.name.name]))

/**
 * Builds a babel AST like the following: `value !== undefined ? value : fallbackValue`.
 *
 * @param {Object} value - babel AST to truthily use.
 * @param {Object} fallbackValue - babel AST to falsily use.
 * @returns The conditional fallback babel AST.
 */
const buildUndefinedConditionalFallback = (value, fallbackValue) =>
  t.conditionalExpression(
    t.binaryExpression('!==', value, t.identifier('undefined')),
    value,
    fallbackValue,
  )

/**
 * Builds a babel AST for a variable declaration e.g. `const var = true`.
 *
 * @param {Object} type - enum of `const`, `let,` or `var`.
 * @param {Object} left - babel AST for the left hand side of the declaration.
 * @param {Object} right - babel AST for the right hand side of the declaration.
 * @returns The variable declaration AST.
 */
const buildVariableDeclaration = (type, left, right) =>
  t.variableDeclaration(type, [
    t.variableDeclarator(t.assignmentPattern(left, right)),
  ])

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

const attrToThemeExpression = (propName, attrValue) => {
  const scaleName = SCALES_MAP[propName]
  const isStyledComponents = themeIdentifier === IDENTIFIERS.styledComponents
  const themeIdentifierPath = isStyledComponents
    ? themeIdentifier + '.theme'
    : themeIdentifier

  if (!scaleName) return attrValue

  const [attrBaseValue, isNegative] = stripNegativeFromAttrValue(attrValue)

  let themeExpression = buildUndefinedConditionalFallback(
    t.memberExpression(
      t.memberExpression(
        t.identifier(themeIdentifierPath),
        t.stringLiteral(scaleName),
        true,
      ),
      attrBaseValue,
      true,
    ),
    attrBaseValue,
  )

  if (isNegative)
    themeExpression = t.binaryExpression(
      '+',
      t.stringLiteral('-'),
      t.parenthesizedExpression(themeExpression),
    )

  return themeExpression
}

const buildCssObjectProperty = (propName, attrValue) =>
  t.objectProperty(
    t.identifier(propName),
    attrToThemeExpression(propName, attrValue),
  )

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
            resultArr.push(buildCssObjectProperty(cssPropertyName, element))
          })
        })
      } else {
        // e.g. prop={bool ? 'foo' : "test"}
        // e.g. prop={'test'}
        // e.g. prop={test}
        cssPropertyNames.forEach(cssPropertyName => {
          baseResult.push(buildCssObjectProperty(cssPropertyName, expression))
        })
      }
    } else {
      // e.g. prop="test"
      cssPropertyNames.forEach(cssPropertyName => {
        baseResult.push(buildCssObjectProperty(cssPropertyName, attrValue))
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
  JSXOpeningElement(path, state) {
    const breakpoints = state.opts.breakpoints ?? DEFAULT_OPTIONS.breakpoints

    themeIdentifier = state.opts.emotion
      ? IDENTIFIERS.emotion
      : IDENTIFIERS.styledComponents

    const name = path.node.name.name
    if (svgTags.includes(name)) return

    state.props = []

    const systemProps = onlySystemProps(path.node.attributes)
    const cssObjectProperties = buildCssObjectProperties(
      systemProps,
      breakpoints,
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
  },
}

export default () => ({
  name: 'styled-system',
  visitor: {
    Program(path, state) {
      path.traverse(jsxOpeningElementVisitor, state)
    },
  },
})
