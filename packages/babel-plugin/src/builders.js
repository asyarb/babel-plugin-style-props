import { types as t } from '@babel/core'

/**
 * Builds a babel AST like the following: `value !== undefined ? value : fallbackValue`.
 *
 * @param {Object} value - babel AST to truthily use.
 * @param {Object} fallbackValue - babel AST to falsily use.
 * @returns The conditional fallback babel AST.
 */
export const buildUndefinedConditionalFallback = (value, fallbackValue) =>
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
export const buildVariableDeclaration = (type, left, right) =>
  t.variableDeclaration(type, [
    t.variableDeclarator(t.assignmentPattern(left, right)),
  ])

export const buildSpreadElement = expression => t.spreadElement(expression)
