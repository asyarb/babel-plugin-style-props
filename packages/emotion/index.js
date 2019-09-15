import React from 'react'

export const Hello = ({ ...props }) => {
  return (
    <div
      mScale={['l', null, true ? 'm' : 'l']}
      pbScale="xl"
      pt={['l', null, null, 'xl']}
      {...props}
    />
  )
}
