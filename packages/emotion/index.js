import React from 'react'

export const Hello = ({ ...props }) => {
  return <div myScale={['l', null, 'm']} p={[0, null, 3]} {...props} />
}
