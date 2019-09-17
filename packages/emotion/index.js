import React from 'react'

const linearScale = () => {}

export const Hello = ({ ...props }) => {
  const myConst = 'l'
  const myScale = linearScale('3rem', '4rem', { count: 4 })

  return <div mtScale={[myConst, 'l', null, myScale]} />
}
