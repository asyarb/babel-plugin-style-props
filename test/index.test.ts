import { PluginItem, transformSync } from '@babel/core'
import jsxSyntax from '@babel/plugin-syntax-jsx'

import styleProps from '../src'

const plugins = [jsxSyntax, styleProps]

const parseCode = (example: string, plug?: PluginItem[]) =>
  transformSync(example, { plugins: plug || plugins })!.code

describe('style prop parsing', () => {
  it.only('handles style props and places them in a new prop', () => {
    const example = `
      const Example = () => {
        return <div sx={{ mb: '3rem', lineHeight: [1.5, 2, null, 4], pFocus: [1, null, null, 4] }} />
      }
    `
    const code = parseCode(example)

    expect(code).toMatchInlineSnapshot(`
      "const Example = () => {
        return <div sx={{
          mb: '3rem',
          lineHeight: [1.5, 2, null, 4],
          pFocus: [1, null, null, 4]
        }} __styleProps__={{
          base: [{
            marginBottom: '3rem',
            lineHeight: 1.5
          }, {
            lineHeight: 2
          }, {}, {
            lineHeight: 4
          }],
          hover: [{}],
          focus: [{
            padding: 1
          }, {}, {}, {
            padding: 4
          }],
          active: [{}]
        }} />;
      };"
    `)
  })
})

//   it('handles responsive style props', () => {
//     const example = `
//       const Example = () => {
//         return <div m={['3rem', '4rem']} display='grid' pt={[null, '4rem', null, '6rem']} />
//       }
//     `
//     const code = parseCode(example)

//     expect(code).toMatchSnapshot()
//   })

//   it('handles variable usage in style props', () => {
//     const example = `
//       const Example = ({ size }) => {
//         const variable = '3rem'
//         const myFunction = () => '4rem'

//         return <div m={[variable, size, myFunction()]} />
//       }
//     `
//     const code = parseCode(example)

//     expect(code).toMatchSnapshot()
//   })

//   it('handles expressions in style props', () => {
//     const example = `
//       const Example = ({ isTest }) => {
//         return <div m={isTest ? '3rem' : '4rem'} />
//       }
//     `
//     const code = parseCode(example)

//     expect(code).toMatchSnapshot()
//   })

//   it('handles style props on multiple elements', () => {
//     const example = `
//       const Example = () => {
//         return (
//           <div m='1rem'>
//             <span p='2rem' />
//           </div>
//         )
//       }
//     `
//     const code = parseCode(example)

//     expect(code).toMatchSnapshot()
//   })

//   it('strips style props if `shouldStrip` is set', () => {
//     const example = `
//       const Example = () => {
//         return (
//           <div
//             p={['1rem', '2rem', '3rem', '4rem']}
//           />
//         )
//       }
//     `
//     const code = parseCode(example, pluginsWithPropRemoval)

//     expect(code).toMatchSnapshot()
//   })

//   it('does not strip non style props if `shouldStrip` is set', () => {
//     const example = `
//       const Example = () => {
//         return (
//           <div
//             p={['1rem', '2rem', '3rem', '4rem']}
//             shouldNotStrip={true}
//           />
//         )
//       }
//     `
//     const code = parseCode(example, pluginsWithPropRemoval)

//     expect(code).toMatchSnapshot()
//   })

//   it('merges parsed props with an existing __styleProps__ prop', () => {
//     const example = `
//       const Example = () => {
//         return (
//           <div
//             p={['1rem', '2rem', '3rem', '4rem']}
//             __styleProps__={{
//               css: {
//                 base: [
//                   {
//                     color: 'red',
//                   },
//                 ],
//                 hover: [
//                   {
//                     color: 'blue',
//                   },
//                 ],
//                 focus: [
//                   {
//                     color: 'purple',
//                   },
//                 ],
//                 active: [
//                   {
//                     color: 'green',
//                   },
//                 ],
//               },
//               extensions: {
//                 scales: {
//                   margin: ['xl'],
//                 },
//                 variants: {
//                   boxStyles: 'primary'
//                 }
//               },
//             }}
//           />
//         )
//       }
//     `
//     const code = parseCode(example)

//     expect(code).toMatchSnapshot()
//   })
// })

// describe('scale prop parsing', () => {
//   it('handles scale props', () => {
//     const example = `
//       const Example = () => {
//         return <div mScale='l' />
//       }
//     `
//     const code = parseCode(example)

//     expect(code).toMatchSnapshot()
//   })

//   it('handles responsive scale props', () => {
//     const example = `
//       const Example = () => {
//         return <div mScale={['l', null, 'm']} />
//       }
//     `
//     const code = parseCode(example)

//     expect(code).toMatchSnapshot()
//   })

//   it('handles variable arrays in scale props', () => {
//     const example = `
//       const Example = () => {
//         const array = ['l', 'l', 'm', 'm', 'xl']

//         return <div mScale={array} />
//       }
//     `
//     const code = parseCode(example)

//     expect(code).toMatchSnapshot()
//   })

//   it('merges scale props with an existing __styleProps__ prop', () => {
//     const example = `
//       const Example = () => {
//         return (
//           <div
//             mScale='l'
//             __styleProps__={{
//               css: {
//                 base: [
//                   {
//                     color: 'red',
//                   },
//                 ],
//                 hover: [
//                   {
//                     color: 'blue',
//                   },
//                 ],
//                 focus: [
//                   {
//                     color: 'purple',
//                   },
//                 ],
//                 active: [
//                   {
//                     color: 'green',
//                   },
//                 ],
//               },
//               extensions: {
//                 scales: {
//                   padding: ['xl'],
//                 },
//                 variants: {
//                   boxStyles: 'primary',
//                 },
//               },
//             }}
//           />
//         )
//       }
//     `
//     const code = parseCode(example)

//     expect(code).toMatchSnapshot()
//   })
// })

// describe('modifiers', () => {
//   it('handles modifier props', () => {
//     const example = `
//       const Example = () => {
//         return <div color='red' colorHover='blue' colorFocus='green' colorActive='purple' />
//       }
//     `
//     const code = parseCode(example)

//     expect(code).toMatchSnapshot()
//   })

//   it('handles responsive modifier props', () => {
//     const example = `
//       const Example = () => {
//         return <div colorHover={['red', null, 'green']} />
//       }
//     `
//     const code = parseCode(example)

//     expect(code).toMatchSnapshot()
//   })

//   it('supports variable usage in modifier props', () => {
//     const example = `
//       const Example = () => {
//         const color = 'red'

//         return <div colorHover={[color, null, 'green']} />
//       }
//     `
//     const code = parseCode(example)

//     expect(code).toMatchSnapshot()
//   })

//   it('supports merging with an existing __styleProps__ with modifier props', () => {
//     const example = `
//       const Example = () => {
//         const color = 'red'

//         return (
//           <div
//             m='3rem'
//             mHover='4rem'
//             mFocus={['5rem', '6rem']}
//             mActive={['6rem', '7rem', null, '8rem']}
//             __styleProps__={{
//               css: {
//                 base: [
//                   {
//                     color: 'red',
//                   },
//                 ],
//                 hover: [
//                   {
//                     color: 'blue',
//                   },
//                 ],
//                 focus: [
//                   {
//                     color: 'purple',
//                   },
//                 ],
//                 active: [
//                   {
//                     color: 'green',
//                   },
//                 ],
//               },
//               extensions: {
//                 scales: {
//                   padding: ['xl'],
//                 },
//                 variants: {
//                   boxStyles: 'primary',
//                 }
//               },
//             }}
//           />
//         )
//       }
//     `
//     const code = parseCode(example)

//     expect(code).toMatchSnapshot()
//   })
// })

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

// describe('kitchen sink', () => {
//   it('handles a large amount of scale and style props', () => {
//     const example = `
//       const Example = () => {
//         const array = ['l', 'l', 'm', 'm', 'xl']
//         const variable = 'huge'

//         return (
//           <div
//             display='flex'
//             mScale={array}
//             fontSize={['1rem', '2rem', null, '3rem']}
//             color='green'
//             colorHover='red'
//             colorFocus={['red', 'green', 'blue']}
//             lineHeight={1.5}
//             pyScale={['l', null, 'xxl']}
//             textTransform='uppercase'
//             fontFamily='system-ui'
//             maxWidth={variable}
//           />
//         )
//       }
//     `
//     const code = parseCode(example)

//     expect(code).toMatchSnapshot()
//   })
// })
