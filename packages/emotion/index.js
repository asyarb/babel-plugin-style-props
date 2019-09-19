import React from 'react'

export default () => {
  const myScale = ['hello', 'world', 'foo', 'bar']

  return <div colorScale={['primary', null, myScale, '#fff']} />
}
