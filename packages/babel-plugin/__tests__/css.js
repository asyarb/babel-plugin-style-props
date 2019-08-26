import { css } from '../src/css'

describe('css', () => {
  it('converts negative theme values', () => {
    const style = css({
      marginLeft: -4,
      marginRight: -4,
    })({
      space: [0, 4, 8, 16, 32],
    })

    expect(style).toEqual({ marginLeft: -32, marginRight: -32 })
  })
})
