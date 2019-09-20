import { types as t } from '@babel/core'

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
    t.variableDeclarator(t.assignmentPattern(left, right))
  ])
}

/**
 * Builds a babel AST like the following: `obj["firstKey"][secondKey]`.
 *
 * @param {Object} obj.
 * @param {Object} firstKey
 * @param {Object} secondKey
 * @returns The nested member expression.
 */
export const buildNestedComputedMemberExpression = (
  obj,
  firstKey,
  secondKey
) => {
  if (!firstKey || !secondKey || !obj) return

  return t.memberExpression(
    t.memberExpression(t.identifier(obj), t.stringLiteral(firstKey), true),
    secondKey,
    true
  )
}