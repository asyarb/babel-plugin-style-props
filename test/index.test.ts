import { PluginItem, transformSync } from '@babel/core'
import jsxSyntax from '@babel/plugin-syntax-jsx'

import styleProps from '../src'

const plugins = [jsxSyntax, styleProps]

const parseCode = (example: string, plug?: PluginItem[]) =>
  transformSync(example, { plugins: plug || plugins })!.code

describe('style prop parsing', () => {
  it('parses the styles', () => {
    const example = `const Comp = () => <div sx={{ mb: '3rem', lineHeight: 4 }} />`
    const code = parseCode(example)

    expect(code).toMatchInlineSnapshot(`
      "const Comp = () => <div sx={{
        mb: '3rem',
        lineHeight: 4
      }} __styleProps__={{
        base: [{
          marginBottom: '3rem',
          lineHeight: 4
        }],
        hover: [{}],
        focus: [{}],
        active: [{}],
        scales: [{}]
      }} />;"
    `)
  })

  it('parses scale styles', () => {
    const example = `const Comp = () => <div sx={{ mtScale: 'l', mbScale: ['l', null, 'xl'] }} />`
    const code = parseCode(example)

    expect(code).toMatchInlineSnapshot(`
      "const Comp = () => <div sx={{
        mtScale: 'l',
        mbScale: ['l', null, 'xl']
      }} __styleProps__={{
        base: [{}],
        hover: [{}],
        focus: [{}],
        active: [{}],
        scales: [{
          marginTop: ['l'],
          marginBottom: ['l', null, 'xl']
        }]
      }} />;"
    `)
  })

  it('parses psuedoClasses', () => {
    const example = `const Comp = () => <div sx={{ colorHover: 'red' }} />`
    const code = parseCode(example)

    expect(code).toMatchInlineSnapshot(`
      "const Comp = () => <div sx={{
        colorHover: 'red'
      }} __styleProps__={{
        base: [{}],
        hover: [{
          color: 'red'
        }],
        focus: [{}],
        active: [{}],
        scales: [{}]
      }} />;"
    `)
  })

  it('parses responsive arrays', () => {
    const example = `const Comp = () => <div sx={{ color: ['red', 'blue', null, 'green'] }} />`
    const code = parseCode(example)

    expect(code).toMatchInlineSnapshot(`
      "const Comp = () => <div sx={{
        color: ['red', 'blue', null, 'green']
      }} __styleProps__={{
        base: [{
          color: 'red'
        }, {
          color: 'blue'
        }, {}, {
          color: 'green'
        }],
        hover: [{}],
        focus: [{}],
        active: [{}],
        scales: [{}]
      }} />;"
    `)
  })

  it('handles variable usage', () => {
    const example = `
      const Comp = ({ size }) => {
        const variable = '3rem'
        const myFunction = () => '4rem'

        return <div sx={{ mb: [variable, size, myFunction()] }} />
      } 
    `
    const code = parseCode(example)

    expect(code).toMatchInlineSnapshot(`
      "const Comp = ({
        size
      }) => {
        const variable = '3rem';
      
        const myFunction = () => '4rem';
      
        return <div sx={{
          mb: [variable, size, myFunction()]
        }} __styleProps__={{
          base: [{
            marginBottom: variable
          }, {
            marginBottom: size
          }, {
            marginBottom: myFunction()
          }],
          hover: [{}],
          focus: [{}],
          active: [{}],
          scales: [{}]
        }} />;
      };"
    `)
  })

  it('parses expressions', () => {
    const example = `const Comp = ({ isRed }) => <div sx={{ color: isRed ? 'red' : 'blue' }} />`
    const code = parseCode(example)

    expect(code).toMatchInlineSnapshot(`
      "const Comp = ({
        isRed
      }) => <div sx={{
        color: isRed ? 'red' : 'blue'
      }} __styleProps__={{
        base: [{
          color: isRed ? 'red' : 'blue'
        }],
        hover: [{}],
        focus: [{}],
        active: [{}],
        scales: [{}]
      }} />;"
    `)
  })

  it('parses multiple elements', () => {
    const example = `
      const Comp = () => {
        return (
          <div sx={{ mt: '1rem' }}>
            <p sx={{ textAlign: 'left' }} />
          </div>
        )
      } 
    `
    const code = parseCode(example)

    expect(code).toMatchInlineSnapshot(`
      "const Comp = () => {
        return <div sx={{
          mt: '1rem'
        }} __styleProps__={{
          base: [{
            marginTop: '1rem'
          }],
          hover: [{}],
          focus: [{}],
          active: [{}],
          scales: [{}]
        }}>
                  <p sx={{
            textAlign: 'left'
          }} __styleProps__={{
            base: [{
              textAlign: 'left'
            }],
            hover: [{}],
            focus: [{}],
            active: [{}],
            scales: [{}]
          }} />
                </div>;
      };"
    `)
  })
})

// describe('variants', () => {
//   it('handles variants from plugin options', () => {
//     const example = `
//       const Example = () => {
//         return <div boxStyle="primary" />
//       }
//     `
//     const code = parseCode(example)

//     expect(code).toMatchSnapshot()
//   })
// })
