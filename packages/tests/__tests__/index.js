import React from 'react'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'

const renderWithProps = Comp => {
  const { container, ...rest } = render(Comp)
  const key = Object.keys(container.firstChild)[0]
  const FiberNode = container.firstChild[key]
  const props = FiberNode.pendingProps

  return { container, props, ...rest }
}

describe('renderWithProps', () => {
  it('renders and returns the props provided', () => {
    const { props, getByText } = renderWithProps(
      <div width="100%" height="100%">
        Hello, world!
      </div>,
    )

    expect(getByText('Hello, world!')).toBeInTheDocument()
    expect(props).toEqual({
      width: '100%',
      height: '100%',
      children: 'Hello, world!',
    })
  })
})
