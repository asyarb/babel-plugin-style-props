import React from 'react'

export const Hello = ({ ...props }) => {
  return <div myScale={['l', null, 'm']} {...props} />
}
