import React from 'react'
import { render } from '@testing-library/react'
import 'jest-styled-components'
import '@testing-library/jest-dom/extend-expect'
import { ThemeProvider } from 'styled-components'

import { theme } from '../theme'

const Providers = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
)

// react-testing-library's render function with wrapped providers and addition return values.
const customRender = Comp => {
  const { container, debug, ...rest } = render(Comp, { wrapper: Providers })
  const key = Object.keys(container.firstChild)[0]
  const FiberNode = container.firstChild[key]
  const props = FiberNode.pendingProps

  return { container, props, result: container.firstChild, debug, ...rest }
}

describe('styled-components integration', () => {
  it('handles system props', () => {
    const { result } = customRender(
      <div bg="white" css={p => ({ color: p.theme.colors.white })} />,
    )

    expect(result).toHaveStyleRule('color', '#FFF')
    expect(result).toHaveStyleRule('background-color', '#FFF')

    /* expect(result).toHaveStyleRule('color', theme.colors.gray[40])
    expect(result).toHaveStyleRule('background-color', theme.colors.white) */
  })

  /* it('parses multiple elements', () => {
    const { result } = customRender(
      <div p="3rem">
        <h1 color="red.40">Hello</h1>
      </div>,
    )

    expect(result).toHaveStyleRule('padding', '3rem')
    expect(result.firstChild).toHaveStyleRule('color', theme.colors.red[40])
  })

  it('does not parse non-system props', () => {
    const { props } = customRender(<div style={{ color: 'blue' }} />)

    expect(props.hasOwnProperty('style')).toBe(true)
    expect(props.hasOwnProperty('className')).toBe(false)
    expect(props.style.color).toBe('blue')
  })

  it('merges styles with existing css prop', () => {
    const { result } = customRender(
      <div
        color="#000"
        p={4}
        css={{
          border: '2px solid',
          fontFamily: 'system-ui',
        }}
      >
        <h1 color="green.20">Hello</h1>
      </div>,
    )

    expect(result).toHaveStyleRule('color', '#000')
    expect(result).toHaveStyleRule('border', '2px solid')
    expect(result).toHaveStyleRule('font-family', 'system-ui')
    expect(result.firstChild).toHaveStyleRule('color', theme.colors.green[20])
  })

  it('merges styles to existing css prop arrow functions', () => {
    const { result } = customRender(
      <div
        p={5}
        css={() => ({
          color: '#fff',
        })}
      />,
    )

    expect(result).toHaveStyleRule('padding', theme.space[5])
    expect(result).toHaveStyleRule('color', '#fff')
  })

  it('merges styles to existing css prop arrow functions with return statement', () => {
    const { result } = customRender(
      <div
        p={5}
        css={() => {
          return {
            color: '#fff',
          }
        }}
      />,
    )

    expect(result).toHaveStyleRule('padding', theme.space[5])
    expect(result).toHaveStyleRule('color', '#fff')
  })

  it('merges styles to existing css prop arrow function that use theme param', () => {
    const { result } = customRender(
      <div
        p={5}
        css={a => ({
          color: a.colors.red[40],
        })}
      />,
    )

    expect(result).toHaveStyleRule('padding', theme.space[5])
    expect(result).toHaveStyleRule('color', theme.colors.red[40])
  })

  it('merges styles to existing css prop arrow functions that use the theme param with a return statement', () => {
    const { result } = customRender(
      <div
        p={5}
        css={a => {
          return {
            color: a.colors.red[40],
          }
        }}
      />,
    )

    expect(result).toHaveStyleRule('padding', theme.space[5])
    expect(result).toHaveStyleRule('color', theme.colors.red[40])
  })

  it('handles property destructuring in css prop arrow functions', () => {
    const { result } = customRender(
      <div
        p={5}
        css={({ colors, space }) => ({
          color: colors.red[40],
          margin: space[4],
        })}
      />,
    )

    expect(result).toHaveStyleRule('padding', theme.space[5])
    expect(result).toHaveStyleRule('color', theme.colors.red[40])
    expect(result).toHaveStyleRule('margin', theme.space[4])
  })

  it('handles property destructuring in css prop arrow functions with a return statement', () => {
    const { result } = customRender(
      <div
        p={5}
        css={({ colors, space }) => {
          return {
            color: colors.red[40],
            margin: space[4],
          }
        }}
      />,
    )

    expect(result).toHaveStyleRule('padding', theme.space[5])
    expect(result).toHaveStyleRule('color', theme.colors.red[40])
    expect(result).toHaveStyleRule('margin', theme.space[4])
  })

  it('merges styles to existing css prop function expressions', () => {
    const { result } = customRender(
      <div
        p={5}
        css={function() {
          return {
            color: '#fff',
          }
        }}
      />,
    )

    expect(result).toHaveStyleRule('padding', theme.space[5])
    expect(result).toHaveStyleRule('color', '#fff')
  })

  it('merges styles to existing css prop function expressions that use the theme param', () => {
    const { result } = customRender(
      <div
        p={5}
        css={function(a) {
          return {
            color: a.colors.red[40],
          }
        }}
      />,
    )

    expect(result).toHaveStyleRule('padding', theme.space[5])
    expect(result).toHaveStyleRule('color', theme.colors.red[40])
  })

  it('merges styles to existing css prop function expressions that use destructuring', () => {
    const { result } = customRender(
      <div
        p={5}
        css={function({ colors, space }) {
          return {
            color: colors.red[40],
            margin: space[4],
          }
        }}
      />,
    )

    expect(result).toHaveStyleRule('padding', theme.space[5])
    expect(result).toHaveStyleRule('color', theme.colors.red[40])
    expect(result).toHaveStyleRule('margin', theme.space[4])
  })

  it('parses array props', () => {
    const { result } = customRender(<div m={[0, '3rem', '6rem']} />)

    expect(result).toHaveStyleRule('margin', '0')
    expect(result).toHaveStyleRule('margin', '3rem', {
      media: 'screen and (min-width: 40em)',
    })
  })

  it('handles responsive directional props', () => {
    const { result } = customRender(<div px={['1rem', '2rem']} />)

    expect(result).toHaveStyleRule('padding-left', '1rem')
    expect(result).toHaveStyleRule('padding-right', '1rem')

    expect(result).toHaveStyleRule('padding-left', '2rem', {
      media: 'screen and (min-width: 40em)',
    })
    expect(result).toHaveStyleRule('padding-right', '2rem', {
      media: 'screen and (min-width: 40em)',
    })
  })

  it('handles responsive scales with null throughout', () => {
    const { result } = customRender(<div m={[null, '2rem', null, '4rem']} />)

    expect(result).not.toHaveStyleRule('margin', '0')
    expect(result).toHaveStyleRule('margin', '2rem', {
      media: 'screen and (min-width: 40em)',
    })
    expect(result).not.toHaveStyleRule('margin', '0', {
      media: 'screen and (min-width: 52em)',
    })
    expect(result).toHaveStyleRule('margin', '4rem', {
      media: 'screen and (min-width: 64em)',
    })
  })

  it('handles negative values', () => {
    const { result } = customRender(<div mr="-large" ml={-4} />)

    expect(result).toHaveStyleRule('margin-right', '-2rem')
    expect(result).toHaveStyleRule('margin-left', '-.75rem')
  })

  it('handles responsive negative values', () => {
    const { result } = customRender(<div m={['-large', 'large', 4, -4]} />)

    expect(result).toHaveStyleRule('margin', '-2rem')
    expect(result).toHaveStyleRule('margin', '2rem', {
      media: 'screen and (min-width: 40em)',
    })
    expect(result).toHaveStyleRule('margin', '.75rem', {
      media: 'screen and (min-width: 52em)',
    })
    expect(result).toHaveStyleRule('margin', '-.75rem', {
      media: 'screen and (min-width: 64em)',
    })
  })

  it('handles a large number of props (kitchen sink)', () => {
    const { result } = customRender(
      <div
        m={[null, '1rem', -4]}
        p="3rem"
        py={['4rem', '5rem']}
        marginBottom="3rem"
        bg="#f0f"
        color="#fff"
        css={a => ({
          border: '2px solid',
          borderColor: a.colors.green[40],
        })}
      />,
    )

    expect(result).toHaveStyleRule('margin', '1rem', {
      media: 'screen and (min-width: 40em)',
    })
    expect(result).toHaveStyleRule('margin', '-.75rem', {
      media: 'screen and (min-width: 52em)',
    })
    expect(result).toHaveStyleRule('padding', '3rem')
    expect(result).toHaveStyleRule('padding-top', '4rem')
    expect(result).toHaveStyleRule('padding-bottom', '4rem')
    expect(result).toHaveStyleRule('padding-top', '5rem', {
      media: 'screen and (min-width: 40em)',
    })
    expect(result).toHaveStyleRule('padding-bottom', '5rem', {
      media: 'screen and (min-width: 40em)',
    })
    expect(result).toHaveStyleRule('margin-bottom', '3rem')
    expect(result).toHaveStyleRule('background-color', '#f0f')
    expect(result).toHaveStyleRule('color', '#fff')
    expect(result).toHaveStyleRule('border', '2px solid')
    expect(result).toHaveStyleRule('border-color', theme.colors.green[40])
  })

  it('uses values from a provided theme', () => {
    const { result } = customRender(
      <div
        color="blue.40"
        fontSize={2}
        fontWeight="bold"
        m={5}
        boxShadow="card"
        lineHeight="copy"
        display="grid"
        bg="green.40"
        rowGap={5}
      />,
    )

    expect(result).toHaveStyleRule('color', theme.colors.blue[40])
    expect(result).toHaveStyleRule('font-size', theme.fontSizes[2])
    expect(result).toHaveStyleRule(
      'font-weight',
      theme.fontWeights.bold.toString(),
    )
    expect(result).toHaveStyleRule('margin', theme.space[5])
    // explictly defined here beacuse css prop trims white space.
    expect(result).toHaveStyleRule(
      'box-shadow',
      'rgba(0,0,0,0.15) 0px 20px 40px',
    )
    expect(result).toHaveStyleRule(
      'line-height',
      theme.lineHeights.copy.toString(),
    )
    expect(result).toHaveStyleRule('display', 'grid')
    expect(result).toHaveStyleRule('background-color', theme.colors.green[40])
    expect(result).toHaveStyleRule('row-gap', theme.space[5])
  }) */
})