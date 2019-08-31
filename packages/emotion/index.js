import React from 'react'

export const Hello = () => {
  return (
    <div
      p={5}
      css={({ colors }) => ({
        color: colors.red[40],
        backgroundColor: '#000',
      })}
    />
  )
}
