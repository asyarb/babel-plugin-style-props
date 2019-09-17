import React from 'react'

export const Hello = ({ ...props }) => {
  return (
    <div
      mScale={linearScale('3rem', '2rem', { count: 4 })}
      pScale={['1rem', null, '3rem', '4rem']}
    />
  )
}
