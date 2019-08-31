import React from 'react'

export const Hello = () => {
  return (
    <div
      p={5}
      css={a => ({
        color: a.colors.red[40],
        backgroundColor: '#000',
      })}
    />
  )
}
