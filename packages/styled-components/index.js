import React from 'react'

const linearScale = () => {}

export const Hello = ({ ...props }) => {
  const myScale = linearScale('3rem', '4rem', { count: 5 })

  return <div pScale={[myScale, null, 'xl']} />
}
