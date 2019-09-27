import React from 'react'

export const Example = () => {
  const size = ['3rem', '4rem', null]
  return (
    <div
      mScale={['l', null, 'r']}
      pScale={size}
      colorScale="red"
      borderBottom="1px solid"
    />
  )
}
