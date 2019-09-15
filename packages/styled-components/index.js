import React from 'react'

export const Hello = ({ ...props }) => {
  const hello = true ? 'm' : 'l'
  const myFunc = () => 'm'

  return (
    <div myScale={[myFunc(), null, hello]} p={[0, null, null, 4]} {...props} />
  )
}
