import React from 'react'

const Example = () => {
  const size = '3rem'
  return (
    <div
      styleProps={[
        {
          margin: size,
        },
        {},
        {
          margin: '4rem',
        },
        {
          margin: '5rem',
        },
      ]}
    />
  )
}
