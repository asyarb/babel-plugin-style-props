import { types as t } from '@babel/core'

import { IDENTIFIERS } from './constants'

const keys = {
  // SPACE
  padding: 'space',
  margin: 'space',
  marginTop: 'space',
  marginRight: 'space',
  marginBottom: 'space',
  marginLeft: 'space',
  marginX: 'space',
  marginY: 'space',
  padding: 'space',
  paddingTop: 'space',
  paddingRight: 'space',
  paddingBottom: 'space',
  paddingLeft: 'space',
  paddingX: 'space',
  paddingY: 'space',
  m: 'space',
  mt: 'space',
  mr: 'space',
  mb: 'space',
  ml: 'space',
  mx: 'space',
  my: 'space',
  p: 'space',
  pt: 'space',
  pr: 'space',
  pb: 'space',
  pl: 'space',
  px: 'space',
  py: 'space',

  // COLOR
  color: 'colors',
  backgroundColor: 'colors',
  borderColor: 'colors',

  // TYPOGRAPHY
  fontFamily: 'fonts',
  fontSize: 'fontSizes',
  fontWeight: 'fontWeights',
  lineHeight: 'lineHeights',
  letterSpacing: 'letterSpacing',

  // LAYOUT
  width: 'sizes',
  height: 'sizes',
  minWidth: 'sizes',
  maxWidth: 'sizes',
  minHeight: 'sizes',
  maxHeight: 'sizes',

  // FLEXBOX -- needs no theme keys

  // GRID LAYOUT
  gridGap: 'space',
  gridRowGap: 'space',
  gridColumnGap: 'space',
  rowGap: 'space',
  columnGap: 'space',
  gap: 'space',

  // BACKGROUND -- needs no theme keys

  // BORDER
  border: 'borders',
  borderTop: 'borders',
  borderRight: 'borders',
  borderBottom: 'borders',
  borderLeft: 'borders',
  borderWidth: 'borderWidths',
  borderColor: 'colors',
  borderTopColor: 'colors',
  borderRightColor: 'colors',
  borderBottomColor: 'colors',
  borderLeftColor: 'colors',
  borderRadius: 'radii',

  // POSITION
  zIndex: 'zIndices',
  top: 'space',
  right: 'space',
  bottom: 'space',
  left: 'space',

  // SHADOW
  boxShadow: 'shadows',
  textShadow: 'shadows',
}

const getThemeKey = key => keys[key]

const enumberableThemeKeys = ['lineHeights']
const cssUnitThemeKeys = [
  'space',
  'fontSizes',
  'sizes',
  'shadows',
  'letterSpacing',
  'borders',
  'borderWidths',
  'radii',
]
const colorThemeKeys = ['colors', 'shadows']

// Checks if the provided value has a CSS unit.
const checkCSSUnits = value =>
  value.match(
    /(\d*\.?\d+)\s?(px|em|ex|%|in|cn|mm|pt|pc|vh|vw|vmax|vmin|ch|rem+)/gim,
  )

// Checks if the provided value is a CSS color string.
const checkCSSColors = value =>
  value.match(
    /^(#[0-9a-f]{3}|#(?:[0-9a-f]{2}){2,4}|(rgb|hsl)a?\((-?\d+%?[,\s]+){2,3}\s*[\d\.]+%?\))$/g,
  )

// This is kind of naive, but this logic checks for values that are likely to not be
// themed values, like when a explicit CSS unit is given or a color string
// is provided.
//
// If there is a better way to do this without knowing the theme upfront,
// someone tell me please.
const checkThemeableValue = (themeKey, value) => {
  if (!themeKey || value === null || typeof value === 'undefined') return false

  const safeValue = value.toString()

  if (typeof value === 'number' && enumberableThemeKeys.includes(themeKey))
    return false
  if (cssUnitThemeKeys.includes(themeKey) && checkCSSUnits(safeValue))
    return false
  if (colorThemeKeys.includes(themeKey) && checkCSSColors(safeValue))
    return false
  if (themeKey === 'lineHeights' && checkCSSUnits(safeValue)) return false

  return true
}

export const createMediaQuery = n => `@media screen and (min-width: ${n})`

// Checks if a provided expression is a negative number eg -2
const isNegativeExpression = value =>
  t.isUnaryExpression(value) && value.operator === '-'

// Checks if a provided expression is a negated string eg '-large'
const isNegativeStringExpression = value =>
  t.isStringLiteral(value) && value.value[0] === '-'

// Returns the system-equivalent AST for a given key and ast node pair.
const getPlainSystemAst = (key, node, themeId) => {
  const themeKey = getThemeKey(key)
  const value = node.value
  const isStyledComp = themeId === IDENTIFIERS.styledComponents

  const themeIdentifier = isStyledComp ? themeId + '.theme' : themeId

  if (!checkThemeableValue(themeKey, value)) return node

  // There is a scale, and the value is nested. eg. `gray.40` => theme.colors.gray['40']
  if (typeof value === 'string' && value.includes('.')) {
    const values = value.split('.')

    return t.memberExpression(
      t.memberExpression(
        t.memberExpression(
          t.identifier(themeIdentifier),
          t.identifier(themeKey),
        ),
        t.identifier(values[0]),
      ),
      t.stringLiteral(values[1]),
      true,
    )
  } else if (typeof value === 'number') {
    // value is an enumerable direct `theme.property[4]` access
    return t.memberExpression(
      t.memberExpression(t.identifier(themeIdentifier), t.identifier(themeKey)),
      t.numericLiteral(value),
      true,
    )
  } else {
    // value is a direct `theme.scale.property` access
    return t.memberExpression(
      t.memberExpression(t.identifier(themeIdentifier), t.identifier(themeKey)),
      t.identifier(value),
    )
  }
}

// Returns the negative system-equivalent AST for a given key and ast node pair.
const getNegativeSystemAst = (key, node, themeId) => {
  const ast = getPlainSystemAst(key, node, themeId)

  return t.binaryExpression('+', t.stringLiteral('-'), ast)
}

const getTernarySystemAst = (key, node, themeId) => {
  const ast = isNegativeExpression(node)
    ? getNegativeSystemAst(key, node.argument, themeId)
    : isNegativeStringExpression(node)
    ? getNegativeSystemAst(
        key,
        t.stringLiteral(node.value.substring(1)),
        themeId,
      )
    : getPlainSystemAst(key, node, themeId)

  return ast
}

// Returns the the appropriate system ast node for a given node. Takes into account negative numbers, strings, and conditional ternaries
export const getSystemAst = (key, node, themeId) => {
  let ast

  if (isNegativeExpression(node)) {
    ast = getNegativeSystemAst(key, node.argument, themeId)
  } else if (isNegativeStringExpression(node)) {
    const nonNegativeBaseStyle = node.value.substring(1)
    ast = getNegativeSystemAst(
      key,
      t.stringLiteral(nonNegativeBaseStyle),
      themeId,
    )
  } else if (t.isConditionalExpression(node)) {
    const consequentAst = getTernarySystemAst(key, node.consequent, themeId)
    const alternateAst = getTernarySystemAst(key, node.alternate, themeId)

    ast = t.conditionalExpression(
      t.identifier(node.test.name),
      consequentAst,
      alternateAst,
    )
  } else {
    ast = getPlainSystemAst(key, node, themeId)
  }

  return ast
}
