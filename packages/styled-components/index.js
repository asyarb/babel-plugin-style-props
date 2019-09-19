import React from 'react'

export default ({ isTransparent, help }) => {
  return <div position={[isTransparent ? 'absolute' : 'relative', help]} />
}
