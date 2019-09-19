import { types as t, traverse } from '@babel/core'

import {
  THEME_MAP,
  SCALE_THEME_MAP,
  STYLE_ALIASES,
  SCALE_BASEPROP_MAP,
  INTERNAL_PROP_ID
} from './constants'
import {
  createMediaQuery,
  castArray,
  times,
  shouldSkipProp,
  isStaticAttr
} from './utils'
import {
  buildVariableDeclaration,
  buildNestedComputedMemberExpression
} from './nodeHelpers'

/**
 * Processes an attribute node and returns the value, stripping any
 * negatives if necessary.
 *
 * @param {Object} attrValue - babel ast node to strip.
 * @returns A tuple containing the base value and a boolean
 * indicating if the value was negative.
 */
export const buildBaseValueAttr = (
  attrValue,
  { withScales = false, mediaIndex = 0 } = {}
) => {
  const isNegative =
    (t.isUnaryExpression(attrValue) && attrValue.operator === '-') ||
    (t.isStringLiteral(attrValue) && attrValue.value[0] === '-')

  let baseAttrValue = attrValue

  const isStatic = isStaticAttr(baseAttrValue)

  if (isNegative && t.isUnaryExpression(attrValue))
    baseAttrValue = attrValue.argument
  if (isNegative && t.isStringLiteral(attrValue))
    baseAttrValue = t.stringLiteral(attrValue.value.substring(1))
  if (!isStatic && withScales)
    baseAttrValue = t.memberExpression(
      baseAttrValue,
      t.numericLiteral(mediaIndex),
      true
    )

  return [baseAttrValue, isNegative, isStatic]
}

const _createStyleComponentsValue = (
  context,
  propName,
  attrValue,
  { isStatic, withScales, scaleIndex, mediaIndex }
) => {
  let value = t.memberExpression(
    t.memberExpression(
      t.memberExpression(t.identifier('p'), t.identifier(INTERNAL_PROP_ID)),
      t.identifier(propName)
    ),
    t.numericLiteral(withScales ? scaleIndex : mediaIndex),
    true
  )

  if (!isStatic && withScales) {
    value = t.memberExpression(value, t.numericLiteral(mediaIndex), true)
  }

  return value
}

/**
 * Given a css prop name and node, returns the equivalent theme aware
 * accessor expression.
 *
 * This function got REALLY ugly from scale support. Needs refactoring.
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
    withNegativeTransform = true,
    withScales = false,
    mediaIndex = 0,
    scaleIndex = 0
  } = {}
) => {
  const { variants, stylingLibrary, propsToPass, themeIdentifierPath } = context

  const scaleThemeKey = SCALE_THEME_MAP[propName]
  const baseThemeKey = THEME_MAP[propName] || variants[propName]
  const isVariant = Boolean(variants[propName])
  const isStyledComponents = stylingLibrary === 'styled-components'

  if (!baseThemeKey && !scaleThemeKey) {
    if (isStyledComponents)
      return _createStyleComponentsValue(context, propName, attrValue, {
        mediaIndex
      })

    return attrValue
  }

  const [attrBaseValue, isNegative, isStatic] = buildBaseValueAttr(attrValue, {
    withScales,
    mediaIndex
  })

  let stylingLibraryBaseValue = attrBaseValue // emotion
  if (isStyledComponents && propsToPass[propName]) {
    stylingLibraryBaseValue = _createStyleComponentsValue(
      context,
      propName,
      attrBaseValue,
      {
        isStatic,
        withScales,
        scaleIndex,
        mediaIndex
      }
    )
  }

  let themeExpressions = [
    null,
    buildNestedComputedMemberExpression(
      themeIdentifierPath,
      baseThemeKey,
      stylingLibraryBaseValue
    )
  ]

  if (!isVariant)
    themeExpressions = [
      t.callExpression(t.identifier('__getDynamicValue'), [
        t.identifier(themeIdentifierPath),
        t.stringLiteral(scaleThemeKey),
        t.stringLiteral(baseThemeKey),
        stylingLibraryBaseValue,
        t.numericLiteral(mediaIndex)
      ]),

      t.callExpression(t.identifier('__getStaticValue'), [
        t.identifier(themeIdentifierPath),
        t.stringLiteral(baseThemeKey),
        stylingLibraryBaseValue
      ])
    ]

  if (withNegativeTransform && isNegative) {
    themeExpressions = themeExpressions.map(expression =>
      t.binaryExpression(
        '+',
        t.stringLiteral('-'),
        t.parenthesizedExpression(expression)
      )
    )
  }

  const [scaleThemeExpression, baseThemeExpression] = themeExpressions

  return withScales ? scaleThemeExpression : baseThemeExpression
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
  { mediaIndex = 0, withScales = false, scaleIndex = 0 } = {}
) => {
  return t.objectProperty(
    t.identifier(propName),
    buildThemeAwareExpression(context, propName, attrValue, {
      mediaIndex,
      withScales,
      scaleIndex
    })
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
 * Normalizes a list scale prop elements to no longer contain
 * any null values. Null values will inherit the `firstLeft`
 * non-null property.
 *
 * @example ['l', null, 'm'] => ['l', 'l', 'm']
 *
 * @param {Object} context
 * @param {Array} elements - The element array from a scale prop.
 * @returns The normalized scale value array.
 */
const _normalizeScaleElements = (context, elements) => {
  const { breakpoints } = context

  const unNulledElements = times(i => {
    if (t.isNullLiteral(elements[i]) || elements[i] === undefined) {
      elements[i] = elements[i - 1] || t.nullLiteral()
    }

    return elements[i]
  }, breakpoints.length + 1)

  return unNulledElements
}

/**
 * Builds an array of theme-aware babel Object Properties for the `css`
 * prop from a list of style prop attributes.
 *
 * @param {Object} context
 * @param {Array} attrNodes - Array of JSX attributes.
 * @param {Object} options
 * @returns An array with the theme aware object properties.
 */
export const buildCssObjectProperties = (
  context,
  attrNodes,
  { withScales = false } = {}
) => {
  const { variants, breakpoints } = context
  const baseResult = []
  const responsiveResults = breakpoints.map(() => [])

  attrNodes.forEach(attrNode => {
    const attrName = attrNode.name.name
    const attrValue = attrNode.value
    const baseAttrName = SCALE_BASEPROP_MAP[attrName] || attrName

    const cssPropertyNames = castArray(
      STYLE_ALIASES[baseAttrName] || baseAttrName
    )

    if (t.isJSXExpressionContainer(attrValue)) {
      // e.g prop={}
      const expression = attrValue.expression

      if (t.isArrayExpression(expression)) {
        // e.g. prop={['test', null, 'test2']}
        const elements = withScales
          ? _normalizeScaleElements(context, expression.elements)
          : expression.elements

        elements.forEach((element, i) => {
          if (i > breakpoints.length) return

          const resultArr = i === 0 ? baseResult : responsiveResults[i - 1]

          cssPropertyNames.forEach(cssPropertyName => {
            _preprocessProp(context, cssPropertyName, element)
            if (shouldSkipProp(element)) return

            resultArr.push(
              buildCssObjectProp(context, cssPropertyName, element, {
                withScales,
                scaleIndex: i,
                mediaIndex: i
              })
            )
          })
        })
      } else {
        // e.g. prop={bool ? 'foo' : "test"}, prop={'test'}, prop={text}
        cssPropertyNames.forEach(cssPropertyName => {
          _preprocessProp(context, cssPropertyName, expression)
          if (shouldSkipProp(expression)) return

          baseResult.push(
            buildCssObjectProp(context, cssPropertyName, expression, {
              withScales
            })
          )

          if (withScales) {
            breakpoints.forEach((_, i) => {
              responsiveResults[i].push(
                buildCssObjectProp(context, cssPropertyName, expression, {
                  withScales,
                  mediaIndex: i + 1,
                  scaleIndex: 0
                })
              )
            })
          }
        })
      }
    } else {
      // e.g. prop="test"
      const isVariant = Boolean(variants[attrNode.name.name])

      cssPropertyNames.forEach(cssPropertyName => {
        _preprocessProp(context, cssPropertyName, attrValue)
        if (shouldSkipProp(attrValue)) return

        if (isVariant) {
          baseResult.push(
            t.spreadElement(
              buildThemeAwareExpression(context, cssPropertyName, attrValue, {
                withNegativeTransform: false
              })
            )
          )
        } else {
          baseResult.push(
            buildCssObjectProp(context, cssPropertyName, attrValue, {
              withScales
            })
          )

          if (withScales) {
            breakpoints.forEach((_, i) => {
              responsiveResults[i].push(
                buildCssObjectProp(context, cssPropertyName, attrValue, {
                  withScales,
                  mediaIndex: i + 1,
                  scaleIndex: 0
                })
              )
            })
          }
        }
      })
    }
  })

  return [...baseResult, ...responsiveResults]
}

/**
 * From an array of theme aware object properties, returns a new array
 * containing a keyed set of object properties by mediaquery.
 *
 * @param {Object} context
 * @param {Array} properties - Array of css object properties.
 *
 * @returns The array of keyed object properties.
 */
export const buildKeyedCssObjectProperties = (context, properties) => {
  const { breakpoints } = context
  const responsiveCssObjectProperties = [[], ...breakpoints.map(() => [])]
  const result = []

  let mediaIndex = 0

  properties.forEach(property => {
    if (t.isObjectProperty(property) || t.isSpreadElement(property))
      responsiveCssObjectProperties[0].push(property)
    else if (property.length) {
      property.forEach(responsiveProperty =>
        responsiveCssObjectProperties[mediaIndex + 1].push(responsiveProperty)
      )
      mediaIndex = (mediaIndex + 1) % breakpoints.length
    } else {
      mediaIndex = (mediaIndex + 1) % breakpoints.length
    }
  })

  responsiveCssObjectProperties.forEach((objectPropertiesForBreakpoint, i) => {
    if (i === 0) result.push(...objectPropertiesForBreakpoint)
    else if (objectPropertiesForBreakpoint.length) {
      const mediaQuery = createMediaQuery(breakpoints[i - 1])

      result.push(
        t.objectProperty(
          t.stringLiteral(mediaQuery),
          t.objectExpression(objectPropertiesForBreakpoint)
        )
      )
    }
  })

  return result
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
        t.objectExpression(objectProperties)
      )
    )
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
        }
      },
      expression,
      functionParam.name
    )
  } else if (t.isObjectPattern(functionParam)) {
    // e.g. css={({ colors, theme }) => }
    bodyStatements = [
      buildVariableDeclaration(
        'const',
        functionParam,
        t.identifier(themeIdentifier)
      )
    ]
  }

  if (t.isObjectExpression(functionBody)) {
    // e.g. css={theme => ({ ... })}
    return [bodyStatements, functionBody.properties]
  } else if (t.isBlockStatement(functionBody)) {
    // e.g. css={theme => { return { ... } }}
    const exisitingBodyStatements = functionBody.body.filter(
      node => !t.isReturnStatement(node)
    )
    const returnStatement = functionBody.body.find(node =>
      t.isReturnStatement(node)
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
  existingCssAttr
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
      returnObjectProperties
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
              t.returnStatement(t.objectExpression(mergedProperties))
            ])
          : t.objectExpression(mergedProperties)
      )
    )
  )
}
