import React from 'react'

export const Hello = ({ ...props }) => {
  return (
    <div myScale={['l', null, true ? 'm' : 'l']} p={[0, null, 3]} {...props} />
  )
}
