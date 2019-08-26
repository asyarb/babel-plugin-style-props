import React from 'react'
import { render } from '@testing-library/react'
import { matchers } from 'jest-emotion'
import '@testing-library/jest-dom/extend-expect'

expect.extend(matchers)

const renderWithProps = Comp => {
  const { container, ...rest } = render(Comp)
  const key = Object.keys(container.firstChild)[0]
  const FiberNode = container.firstChild[key]
  const props = FiberNode.pendingProps

  return { container, props, ...rest }
}

describe('renderWithProps', () => {
  it('renders', () => {
    const { container, getByText } = renderWithProps(
      <div width="100%" height="100%">
        Hello, world!
      </div>,
    )

    expect(getByText('Hello, world!')).toBeInTheDocument()
  })
})

describe('babel-plugin', () => {
  it('renders with the correct styles', () => {
    const { container } = renderWithProps(
      <div width="100%" height="100%">
        Hello, world!
      </div>,
    )

    expect(container.firstChild).toHaveStyleRule('width', '100%')
  })
})
