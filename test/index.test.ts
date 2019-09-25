import { transformSync } from '@babel/core'
import jsxSyntax from '@babel/plugin-syntax-jsx'
import styleProps from '../src'

const plugins = [jsxSyntax, styleProps]

const parseCode = (example: string) => transformSync(example, { plugins })!.code

describe('babel-plugin', () => {
  it('parses props correctly', () => {
    const example = `
      const Example = () => {
        const size = "3rem"
        const func = () => '4rem'
        
        return <div m={[size, null, true ? '4rem' : '5rem', func()]} p="3rem" />
      }
    `
    const code = parseCode(example)

    expect(code).toMatchInlineSnapshot(`
      "const Example = () => {
        const size = \\"3rem\\";

        const func = () => '4rem';

        return <div m={[size, null, true ? '4rem' : '5rem', func()]} p=\\"3rem\\" __styleProps__={[{
          margin: size,
          padding: \\"3rem\\"
        }, {}, {
          margin: true ? '4rem' : '5rem'
        }, {
          margin: func()
        }]} />;
      };"
    `)
  })
})
