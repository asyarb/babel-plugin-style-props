import React from 'react'

export const Hello = () => {
  return (
    <div
      p={5}
      css={function() {
        const woah = true

        return {
          color: '#fff',
        }
      }}
    />
  )
}
