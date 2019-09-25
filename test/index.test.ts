import { transformSync } from '@babel/core'
import jsxSyntax from '@babel/plugin-syntax-jsx'
import styleProps from '../src'

const plugins = [jsxSyntax, styleProps]

const parseCode = (example: string) => transformSync(example, { plugins })!.code

describe('babel-plugin', () => {
  it('doesnt crash', () => {
    const example = `
      const Example = () => {
        return <div mx="3rem" />
      }
    `
    const code = parseCode(example)

    expect(code).toMatchInlineSnapshot(`
      "const Example = () => {
        return <div mx=\\"3rem\\" />;
      };"
    `)
  })
})
