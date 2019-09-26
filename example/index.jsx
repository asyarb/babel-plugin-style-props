import React from 'react'

export const Example = () => {
  const size = '3rem'
  return (
    <div
      m={['1rem', '2rem']}
      shouldNotStrip={true}
      __styleProps__={[
        {
          margin: size,
        },
        {},
        {
          margin: '4rem',
          padding: '3rem',
        },
        {
          margin: '5rem',
        },
      ]}
    />
  )
}
