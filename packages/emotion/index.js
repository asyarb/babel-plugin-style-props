import React from 'react'

export default () => {
  const myScale = ['hello', 'world', 'foo', 'bar']
  const myVar = 'l'

  return <div m={['1rem', '2rem', myVar]} colorScale={myScale} />
}
