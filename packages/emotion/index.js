import React from 'react'

export const Hello = () => {
  const bool = true

  return (
    <div
      m={[bool ? 1 : 2, -2, 'large', '-large']}
      p={[1]}
      css={({ colors }) => ({
        color: colors.red,
      })}
    />
  )
}
