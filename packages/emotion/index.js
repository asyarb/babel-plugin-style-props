import React from 'react'

export const Hello = () => {
  return (
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
    />
  )
}
