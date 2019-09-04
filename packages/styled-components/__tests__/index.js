import React from 'react'
import renderer, { act } from 'react-test-renderer'
import 'jest-styled-components'
import { ThemeProvider } from 'styled-components'

import { theme } from '../theme'

const Providers = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
)

const customRender = children => {
  let tree
  act(() => {
    tree = renderer.create(<Providers>{children}</Providers>)
  })
  return tree
}

describe('styled-components integration', () => {
  it('handles system props', () => {
    const tree = customRender(<div color="black" bg="white" />)
    const json = tree.toJSON()

    expect(json).toHaveStyleRule('color', theme.colors.black)
    expect(json).toHaveStyleRule('background-color', theme.colors.white)
  })

  it('parses multiple elements', () => {
    const tree = customRender(
      <div p="3rem">
        <h1 color="black">Hello</h1>
      </div>,
    )
    const json = tree.toJSON()

    expect(json).toHaveStyleRule('padding', '3rem')
    expect(json.children[0]).toHaveStyleRule('color', theme.colors.black)
  })

  it('does not parse non-system props', () => {
    const tree = customRender(<div style={{ color: 'blue' }} />)
    const json = tree.toJSON()
    const props = json.props

    expect(props.hasOwnProperty('style')).toBe(true)
    expect(props.hasOwnProperty('className')).toBe(false)
    expect(props.style.color).toBe('blue')
  })

  it('merges styles with existing css prop', () => {
    const tree = customRender(
      <div
        color="#000"
        p={4}
        css={{
          border: '2px solid',
          fontFamily: 'system-ui',
        }}
      >
        <h1 color="white">Hello</h1>
      </div>,
    )
    const json = tree.toJSON()

    expect(json).toHaveStyleRule('color', '#000')
    expect(json).toHaveStyleRule('border', '2px solid')
    expect(json).toHaveStyleRule('font-family', 'system-ui')
    expect(json.children[0]).toHaveStyleRule('color', theme.colors.white)
  })

  it('merges styles to existing css prop arrow functions', () => {
    const tree = customRender(
      <div
        p={5}
        css={() => ({
          color: '#fff',
        })}
      />,
    )
    const json = tree.toJSON()

    expect(json).toHaveStyleRule('padding', theme.space[5])
    expect(json).toHaveStyleRule('color', '#fff')
  })

  it('merges styles to existing css prop arrow functions with return statement', () => {
    const tree = customRender(
      <div
        p={5}
        css={() => {
          return {
            color: '#fff',
          }
        }}
      />,
    )
    const json = tree.toJSON()

    expect(json).toHaveStyleRule('padding', theme.space[5])
    expect(json).toHaveStyleRule('color', '#fff')
  })

  it('merges styles to existing css prop arrow function that use theme param', () => {
    const tree = customRender(
      <div
        p={5}
        css={a => ({
          color: a.theme.colors.white,
        })}
      />,
    )
    const json = tree.toJSON()

    expect(json).toHaveStyleRule('padding', theme.space[5])
    expect(json).toHaveStyleRule('color', theme.colors.white)
  })

  it('merges styles to existing css prop arrow functions that use the theme param with a return statement', () => {
    const tree = customRender(
      <div
        p={5}
        css={a => {
          return {
            color: a.theme.colors.white,
          }
        }}
      />,
    )
    const json = tree.toJSON()

    expect(json).toHaveStyleRule('padding', theme.space[5])
    expect(json).toHaveStyleRule('color', theme.colors.white)
  })

  it('handles property destructuring in css prop arrow functions', () => {
    const tree = customRender(
      <div
        p={5}
        css={({ theme }) => ({
          color: theme.colors.white,
          margin: theme.space[4],
        })}
      />,
    )
    const json = tree.toJSON()

    expect(json).toHaveStyleRule('padding', theme.space[5])
    expect(json).toHaveStyleRule('color', theme.colors.white)
    expect(json).toHaveStyleRule('margin', theme.space[4])
  })

  it('handles property destructuring in css prop arrow functions with a return statement', () => {
    const tree = customRender(
      <div
        p={5}
        css={({ theme }) => {
          return {
            color: theme.colors.white,
            margin: theme.space[4],
          }
        }}
      />,
    )
    const json = tree.toJSON()

    expect(json).toHaveStyleRule('padding', theme.space[5])
    expect(json).toHaveStyleRule('color', theme.colors.white)
    expect(json).toHaveStyleRule('margin', theme.space[4])
  })

  it('merges styles to existing css prop function expressions', () => {
    const tree = customRender(
      <div
        p={5}
        css={function() {
          return {
            color: '#fff',
          }
        }}
      />,
    )
    const json = tree.toJSON()

    expect(json).toMatchInlineSnapshot(`
      .c0 {
        padding: 1rem;
        color: #fff;
      }

      <div
        className="c0"
      />
    `)
    expect(json).toHaveStyleRule('padding', theme.space[5])
    expect(json).toHaveStyleRule('color', '#fff')
  })

  it('merges styles to existing css prop function expressions that use the theme param', () => {
    const tree = customRender(
      <div
        p={5}
        css={function(a) {
          return {
            color: a.theme.colors.white,
          }
        }}
      />,
    )
    const json = tree.toJSON()

    expect(json).toHaveStyleRule('padding', theme.space[5])
    expect(json).toHaveStyleRule('color', theme.colors.white)
  })

  it('merges styles to existing css prop function expressions that use destructuring', () => {
    const tree = customRender(
      <div
        p={5}
        css={function({ theme }) {
          return {
            color: theme.colors.white,
            margin: theme.space[4],
          }
        }}
      />,
    )
    const json = tree.toJSON()

    expect(json).toHaveStyleRule('padding', theme.space[5])
    expect(json).toHaveStyleRule('color', theme.colors.white)
    expect(json).toHaveStyleRule('margin', theme.space[4])
  })

  it('parses array props', () => {
    const tree = customRender(<div m={[0, '3rem', '6rem']} />)
    const json = tree.toJSON()

    expect(json).toHaveStyleRule('margin', '0')
    expect(json).toHaveStyleRule('margin', '3rem', {
      media: 'screen and (min-width: 40em)',
    })
  })

  it('handles responsive directional props', () => {
    const tree = customRender(<div px={['1rem', '2rem']} />)
    const json = tree.toJSON()

    expect(json).toHaveStyleRule('padding-left', '1rem')
    expect(json).toHaveStyleRule('padding-right', '1rem')

    expect(json).toHaveStyleRule('padding-left', '2rem', {
      media: 'screen and (min-width: 40em)',
    })
    expect(json).toHaveStyleRule('padding-right', '2rem', {
      media: 'screen and (min-width: 40em)',
    })
  })

  it('handles responsive scales with null throughout', () => {
    const tree = customRender(<div m={[null, '2rem', null, '4rem']} />)
    const json = tree.toJSON()

    expect(json).not.toHaveStyleRule('margin', '0')
    expect(json).toHaveStyleRule('margin', '2rem', {
      media: 'screen and (min-width: 40em)',
    })
    expect(json).not.toHaveStyleRule('margin', '0', {
      media: 'screen and (min-width: 52em)',
    })
    expect(json).toHaveStyleRule('margin', '4rem', {
      media: 'screen and (min-width: 64em)',
    })
  })

  it('handles negative values', () => {
    const tree = customRender(<div mr="-large" ml={-4} />)
    const json = tree.toJSON()

    expect(json).toHaveStyleRule('margin-right', '-2rem')
    expect(json).toHaveStyleRule('margin-left', '-.75rem')
  })

  it('handles responsive negative values', () => {
    const tree = customRender(<div m={['-large', 'large', 4, -4]} />)
    const json = tree.toJSON()

    expect(json).toHaveStyleRule('margin', '-2rem')
    expect(json).toHaveStyleRule('margin', '2rem', {
      media: 'screen and (min-width: 40em)',
    })
    expect(json).toHaveStyleRule('margin', '.75rem', {
      media: 'screen and (min-width: 52em)',
    })
    expect(json).toHaveStyleRule('margin', '-.75rem', {
      media: 'screen and (min-width: 64em)',
    })
  })

  it('handles a large number of props (kitchen sink)', () => {
    const tree = customRender(
      <div
        m={[null, '1rem', -4]}
        p="3rem"
        py={['4rem', '5rem']}
        marginBottom="3rem"
        bg="#f0f"
        color="#fff"
      />,
    )
    const json = tree.toJSON()

    expect(json).toHaveStyleRule('margin', '1rem', {
      media: 'screen and (min-width: 40em)',
    })
    expect(json).toHaveStyleRule('margin', '-.75rem', {
      media: 'screen and (min-width: 52em)',
    })
    expect(json).toHaveStyleRule('padding', '3rem')
    expect(json).toHaveStyleRule('padding-top', '4rem')
    expect(json).toHaveStyleRule('padding-bottom', '4rem')
    expect(json).toHaveStyleRule('padding-top', '5rem', {
      media: 'screen and (min-width: 40em)',
    })
    expect(json).toHaveStyleRule('padding-bottom', '5rem', {
      media: 'screen and (min-width: 40em)',
    })
    expect(json).toHaveStyleRule('margin-bottom', '3rem')
    expect(json).toHaveStyleRule('background-color', '#f0f')
    expect(json).toHaveStyleRule('color', '#fff')
  })

  it('uses values from a provided theme', () => {
    const tree = customRender(
      <div
        color="white"
        fontSize={2}
        fontWeight="bold"
        m={5}
        boxShadow="card"
        lineHeight="copy"
        display="grid"
        bg="white"
        rowGap={5}
      />,
    )
    const json = tree.toJSON()

    expect(json).toHaveStyleRule('color', theme.colors.white)
    expect(json).toHaveStyleRule('font-size', theme.fontSizes[2])
    expect(json).toHaveStyleRule(
      'font-weight',
      theme.fontWeights.bold.toString(),
    )
    expect(json).toHaveStyleRule('margin', theme.space[5])
    // explictly defined here beacuse css prop trims white space.
    expect(json).toHaveStyleRule('box-shadow', 'rgba(0,0,0,0.15) 0px 20px 40px')
    expect(json).toHaveStyleRule(
      'line-height',
      theme.lineHeights.copy.toString(),
    )
    expect(json).toHaveStyleRule('display', 'grid')
    expect(json).toHaveStyleRule('background-color', theme.colors.white)
    expect(json).toHaveStyleRule('row-gap', theme.space[5])
  })
})
