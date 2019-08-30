import React from 'react'
import { render } from '@testing-library/react'
import { matchers } from 'jest-emotion'
import '@testing-library/jest-dom/extend-expect'
import { ThemeProvider } from 'emotion-theming'

import { theme } from '../theme'

expect.extend(matchers)

const Providers = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
)

// react-testing-library's render function with wrapped providers and addition return values.
const customRender = Comp => {
  const { container, ...rest } = render(Comp, { wrapper: Providers })
  const key = Object.keys(container.firstChild)[0]
  const FiberNode = container.firstChild[key]
  const props = FiberNode.pendingProps

  return { container, props, result: container.firstChild, ...rest }
}

describe('emotion integration', () => {
  it('parses style props', () => {
    const { result } = customRender(<div color="tomato" bg="#fff" />)

    expect(result).toHaveStyleRule('color', 'tomato')
    expect(result).toHaveStyleRule('background-color', '#fff')
  })

  it('parses multiple elements', () => {
    const { result } = customRender(
      <div p="3rem">
        <h1 color="tomato">Hello</h1>
      </div>,
    )

    expect(result).toHaveStyleRule('padding', '3rem')
    expect(result.firstChild).toHaveStyleRule('color', 'tomato')
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
        <h1 color="tomato">Hello</h1>
      </div>,
    )

    expect(result).toHaveStyleRule('color', '#000')
    expect(result).toHaveStyleRule('border', '2px solid')
    expect(result).toHaveStyleRule('font-family', 'system-ui')
    expect(result.firstChild).toHaveStyleRule('color', 'tomato')
  })

  it('merges styles to existing css prop inline functions', () => {
    const { result } = customRender(
      <div
        p="3rem"
        css={theme => ({
          color: 'tomato',
        })}
      />,
    )

    expect(result).toHaveStyleRule('padding', '3rem')
    expect(result).toHaveStyleRule('color', 'tomato')
  })

  it('merges styles to existing css prop inline functions with return statement', () => {
    const { result } = customRender(
      <div
        p="3rem"
        css={theme => {
          return {
            color: 'tomato',
          }
        }}
      />,
    )

    expect(result).toHaveStyleRule('padding', '3rem')
    expect(result).toHaveStyleRule('color', 'tomato')
  })

  it('does not parse non-system props', () => {
    const { result, props } = customRender(<div style={{ color: 'blue' }} />)

    expect(props.hasOwnProperty('style')).toBe(true)
    expect(props.hasOwnProperty('className')).toBe(false)
    expect(props.style.color).toBe('blue')
  })

  it('parses array props', () => {
    const { result } = customRender(<div m={['0', '3rem', '6rem']} />)

    expect(result).toHaveStyleRule('margin', '0')
    expect(result).toHaveStyleRule('margin', '3rem', {
      media: 'screen and (min-width: 40em)',
    })
    expect(result).toHaveStyleRule('margin', '6rem', {
      media: 'screen and (min-width: 52em)',
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

  it('handles a large number of props (kitchen sink)', () => {
    const { result } = customRender(
      <div
        m={['0', '1rem', '2rem']}
        p="3rem"
        py={['4rem', '5rem']}
        marginBottom="3rem"
        bg="tomato"
        color="#fff"
        css={{
          border: '2px solid gold',
        }}
      />,
    )

    expect(result).toHaveStyleRule('margin', '0')
    expect(result).toHaveStyleRule('margin', '1rem', {
      media: 'screen and (min-width: 40em)',
    })
    expect(result).toHaveStyleRule('margin', '2rem', {
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
    expect(result).toHaveStyleRule('background-color', 'tomato')
    expect(result).toHaveStyleRule('color', '#fff')
    expect(result).toHaveStyleRule('border', '2px solid gold')
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
    // explictly defined here beacuse we trim white space.
    expect(result).toHaveStyleRule(
      'box-shadow',
      'rgba(0,0,0,0.15) 0px 20px 40px',
    )
    expect(result).toHaveStyleRule(
      'line-height',
      theme.lineHeights.copy.toString(),
    )
    expect(result).toHaveStyleRule('display', 'grid')
    expect(result).toHaveStyleRule('row-gap', theme.space[5])
  })
})
