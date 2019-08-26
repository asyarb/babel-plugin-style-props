import React from 'react'
import { render } from '@testing-library/react'
import { ThemeProvider } from 'styled-components'
import 'jest-styled-components'
import '@testing-library/jest-dom/extend-expect'

import { theme } from '../theme'

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

describe('styled-components', () => {
  it('actually works', () => {
    const { result, props } = customRender(<div color="tomato" bg="#fff" />)
  })
})
