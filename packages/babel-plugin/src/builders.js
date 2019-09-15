import { types as t, traverse } from '@babel/core'

import { THEME_MAP, SYSTEM_ALIASES, INTERNAL_PROP_ID } from './constants'
import { createMediaQuery, castArray, shouldSkipProp } from './utils'

/**
 * Builds a babel AST like the following: `value !== undefined ? value : fallbackValue`.
 *
 * @param {Object} value - babel AST to truthily use.
 * @param {Object} fallbackValue - babel AST to falsily use.
 * @returns The conditional fallback babel AST.
 */
export const buildUndefinedConditionalFallback = (value, fallbackValue) => {
  return t.conditionalExpression(
    t.binaryExpression('!==', value, t.identifier('undefined')),
    value,
    fallbackValue,
  )
}

/**
 * Builds a babel AST for a variable declaration e.g. `const var = true`.
 *
 * @param {Object} type - enum of `const`, `let,` or `var`.
 * @param {Object} left - babel AST for the left hand side of the declaration.
 * @param {Object} right - babel AST for the right hand side of the declaration.
 * @returns The variable declaration AST.
 */
export const buildVariableDeclaration = (type, left, right) => {
  return t.variableDeclaration(type, [
    t.variableDeclarator(t.assignmentPattern(left, right)),
  ])
}

/**
 * Processes an attribute node and returns the value, stripping any
 * negatives if necessary.
 *
 * @param {Object} attrValue - babel ast node to strip.
 * @returns A tuple containing the base value and a boolean
 * indicating if the value was negative.
 */
export const buildBaseValueAttr = attrValue => {
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

/**
 * Given a css prop name and node, returns the equivalent theme aware
 * accessor expression.
 *
 * @param {Object} context
 * @param {string} propName - Name of the prop being converted.
 * @param {Object} attrValue - Babel AST to convert.
 * @param {Object} options - Optional options for this utility.
 * @returns The equivalent theme appropriate AST.
 */
export const buildThemeAwareExpression = (
  context,
  propName,
  attrValue,
  {
    withUndefinedFallback = true,
    withNegativeTransform = true,
    mediaIndex = 0,
  } = {},
) => {
  const { variants, stylingLibrary, propsToPass, themeIdentifierPath } = context

  const scaleName = THEME_MAP[propName] || variants[propName]
  if (!scaleName) return attrValue

  const [attrBaseValue, isNegative] = buildBaseValueAttr(attrValue)
  let stylingLibraryAttrValue = attrBaseValue // emotion

  if (stylingLibrary === 'styled-components' && propsToPass[propName])
    stylingLibraryAttrValue = t.memberExpression(
      t.memberExpression(
        t.memberExpression(t.identifier('p'), t.identifier(INTERNAL_PROP_ID)),
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

/**
 * Given a prop name and babel node, returns an object property containing
 * the prop name as the key and the appropriate theme-aware accessor as it's
 * value.
 *
 * @param {Object} context
 * @param {string} propName - Prop name to build
 * @param {Object} attrValue - Babel node to build into theme-aware accessor.
 * @param {Object} param2 - Optional options. Used for specifying the current media
 * breakpoint.
 */
export const buildCssObjectProp = (
  context,
  propName,
  attrValue,
  { mediaIndex = 0 } = {},
) => {
  return t.objectProperty(
    t.identifier(propName),
    buildThemeAwareExpression(context, propName, attrValue, { mediaIndex }),
  )
}

/**
 * Function to perform any related side-effects for a system prop,
 * e.g. adding it to our private-prop accumulator for `styled-components`.
 * @private
 *
 * @param {Object} context
 * @param {string} propName - The name of the system prop to process.
 * @param {Object} attrValue - The Babel node to process.
 */
const _preprocessProp = (context, propName, attrValue) => {
  const { propsToPass } = context

  const [attrBaseValue, isNegative] = buildBaseValueAttr(attrValue)

  propsToPass[propName] = propsToPass[propName] || []

  if (isNegative) propsToPass[propName].push(attrBaseValue)
  else propsToPass[propName].push(attrValue)
}

/**
 * Builds an array of theme-aware babel Object Properties for the `css`
 * prop from a list of system-prop-JSX attribute nodes.
 *
 * @param {Object} context
 * @param {Array} attrNodes - Array of JSX attributes.
 * @param {Array} breakpoints - Media query breakpoints.
 * @returns An array with the theme aware object properties.
 */
export const buildCssObjectProperties = (context, attrNodes, breakpoints) => {
  const { variants } = context
  const baseResult = []
  const responsiveResults = []

  attrNodes.forEach(attrNode => {
    const attrName = attrNode.name.name
    const attrValue = attrNode.value
    const cssPropertyNames = castArray(SYSTEM_ALIASES[attrName] || attrName)

    if (t.isJSXExpressionContainer(attrValue)) {
      // e.g prop={}
      const expression = attrValue.expression

      if (t.isArrayExpression(expression)) {
        // e.g. prop={['test', null, 'test2']}
        expression.elements.forEach((element, i) => {
          responsiveResults[i] = responsiveResults[i] || []

          const resultArr = i === 0 ? baseResult : responsiveResults[i - 1]

          cssPropertyNames.forEach(cssPropertyName => {
            _preprocessProp(context, cssPropertyName, element)
            if (shouldSkipProp(element)) return

            resultArr.push(
              buildCssObjectProp(context, cssPropertyName, element, {
                mediaIndex: i,
              }),
            )
          })
        })
      } else {
        // e.g. prop={bool ? 'foo' : "test"}, prop={'test'}, prop={text}
        cssPropertyNames.forEach(cssPropertyName => {
          _preprocessProp(context, cssPropertyName, expression)
          if (shouldSkipProp(expression)) return

          baseResult.push(
            buildCssObjectProp(context, cssPropertyName, expression),
          )
        })
      }
    } else {
      // e.g. prop="test"
      const isVariant = Boolean(variants[attrNode.name.name])

      cssPropertyNames.forEach(cssPropertyName => {
        _preprocessProp(context, cssPropertyName, attrValue)
        if (shouldSkipProp(attrValue)) return

        if (isVariant)
          baseResult.push(
            t.spreadElement(
              buildThemeAwareExpression(context, cssPropertyName, attrValue, {
                withUndefinedFallback: false,
                withNegativeTransform: false,
              }),
            ),
          )
        else
          baseResult.push(
            buildCssObjectProp(context, cssPropertyName, attrValue),
          )
      })
    }
  })

  const keyedResponsiveResults = responsiveResults
    .map((objectPropertiesForBreakpoint, i) => {
      const mediaQuery = createMediaQuery(breakpoints[i])

      return t.objectProperty(
        t.stringLiteral(mediaQuery),
        t.objectExpression(objectPropertiesForBreakpoint),
      )
    })
    .filter(results => results.value.properties.length)

  return [...baseResult, ...keyedResponsiveResults]
}

/**
 * Builds the JSX AST for the `css` prop given a list of
 * object property ASTs.
 *
 * @param {Object} context
 * @param {Array} objectProperties - List of object properties.
 * @returns A JSX attribute AST for the `css` prop.
 */
export const buildCssAttr = (context, objectProperties) => {
  const { themeIdentifier } = context

  return t.jsxAttribute(
    t.jSXIdentifier('css'),
    t.jSXExpressionContainer(
      t.arrowFunctionExpression(
        [t.identifier(themeIdentifier)],
        t.objectExpression(objectProperties),
      ),
    ),
  )
}

/**
 * Given a function expression from a `css` prop, returns a tuple
 * containining an array of the body statements from the expression,
 * and the return statement of the expression.
 *
 * Also handles renaming any existing identifiers from the
 * function expression's parameters or destructured parameters that are used
 * in the function expression body or return statement.
 *
 * @param {Object} context
 * @param {Object} expression - Babel function/arrow function expression node.
 * @returns The tuple of body statements and return statement.
 */
const _extractAndCleanFunctionParts = (context, expression) => {
  const { themeIdentifier } = context

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

    // TODO: throw error if returnStatement.argument is not an object.
    return [bodyStatements, returnStatement.argument.properties]
  }
}

/**
 * Builds a merged `css` prop given a list of theme aware object properties and
 * the existing CSS prop Babel node.
 *
 * @param {Object} context
 * @param {Array} objectProperties - Theme aware object properties.
 * @param {Object} existingCssAttr - The Babel node of an existing `css` prop.
 * @returns The merged `css` prop node.
 */
export const buildMergedCssAttr = (
  context,
  objectProperties,
  existingCssAttr,
) => {
  const { themeIdentifier } = context

  const existingExpression = existingCssAttr.value.expression
  let mergedProperties = []
  let bodyStatements = []

  if (t.isObjectExpression(existingExpression))
    mergedProperties = [...objectProperties, ...existingExpression.properties]
  else if (t.isFunction(existingExpression)) {
    const [
      extractedBodyStatements,
      returnObjectProperties,
    ] = _extractAndCleanFunctionParts(context, existingExpression)

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
