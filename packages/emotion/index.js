import React from 'react'

export const Hello = ({ ...props }) => {
  return <div mbScale="-xl" pbScale={['-l', null, 'm']} mt="-3rem" {...props} />
}
