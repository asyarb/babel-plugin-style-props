import svgTags from 'svg-tags'
import { types as t } from '@babel/core'

import { createMediaQuery } from './system'
import {
  SYSTEM_PROPS,
  SYSTEM_ALIASES,
  DEFAULT_OPTIONS,
  SCALES_MAP,
} from './constants'

const castArray = x => (Array.isArray(x) ? x : [x])

const onlySystemProps = attrs =>
  attrs?.filter(attr => Boolean(SYSTEM_PROPS[(attr?.name?.name)]))

const notSystemProps = attrs =>
  attrs.filter(attr => !Boolean(SYSTEM_PROPS[(attr?.name?.name)]))

const buildUndefinedConditionalFallback = (value, fallbackValue) =>
  t.conditionalExpression(
    t.binaryExpression('!==', value, t.identifier('undefined')),
    value,
    fallbackValue,
  )

const stripNegativeFromAttrValue = attrValue => {
  const isNegative =
    (t.isUnaryExpression(attrValue) && attrValue.operator === '-') ||
    (t.isStringLiteral(attrValue) && attrValue.value[0] === '-')

  let baseAttrValue = attrValue

  if (isNegative && t.isUnaryExpression(attrValue))
    baseAttrValue = attrValue?.argument
  if (isNegative && t.isStringLiteral(attrValue))
    baseAttrValue = t.stringLiteral(attrValue?.value?.substring(1))

  return [baseAttrValue, isNegative]
}

const attrToThemeExpression = (propName, attrValue) => {
  const scaleName = SCALES_MAP[propName]

  if (!scaleName) return attrValue

  const [attrBaseValue, isNegative] = stripNegativeFromAttrValue(attrValue)

  let themeExpression = buildUndefinedConditionalFallback(
    t.memberExpression(
      t.memberExpression(
        t.identifier('__theme__'),
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
    const attrName = attrNode?.name?.name
    const attrValue = attrNode?.value
    const cssPropertyNames = castArray(SYSTEM_ALIASES[attrName] || attrName)

    if (t.isJSXExpressionContainer(attrValue)) {
      const expression = attrValue.expression

      if (t.isArrayExpression(expression)) {
        // e.g. prop={['test', null, 'test2']}
        expression?.elements.forEach((element, i) => {
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

const buildCssAttr = (objectProperties, existingCssAttr) => {
  if (!objectProperties.length) return existingCssAttr

  if (existingCssAttr) {
    // ignore for now
  }

  return t.jsxAttribute(
    t.jSXIdentifier('css'),
    t.jSXExpressionContainer(
      t.arrowFunctionExpression(
        [t.identifier('__theme__')],
        t.objectExpression(objectProperties),
      ),
    ),
  )
}

const jsxOpeningElementVisitor = {
  JSXOpeningElement(path, state) {
    const breakpoints = state?.opts?.breakpoints ?? DEFAULT_OPTIONS.breakpoints

    const name = path.node.name.name
    if (svgTags.includes(name)) return

    state.props = []

    const systemProps = onlySystemProps(path.node.attributes)
    const cssObjectProperties = buildCssObjectProperties(
      systemProps,
      breakpoints,
    )

    const existingCssAttr = path.node.attributes.find(
      attr => attr?.name?.name === 'css',
    )
    const newCssAttr = buildCssAttr(cssObjectProperties, existingCssAttr)

    path.node.attributes = notSystemProps(path.node.attributes).filter(
      attr => attr?.name?.name !== 'css',
    )
    if (newCssAttr) path.node.attributes.push(newCssAttr)
  },
}

const programVisitor = {
  Program(path, state) {
    path.traverse(jsxOpeningElementVisitor, state)
  },
}

export default () => {
  return {
    name: 'styled-system',
    visitor: programVisitor,
  }
}
