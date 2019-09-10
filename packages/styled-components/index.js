import React from 'react'

export const Hello = () => {
  const mySpace = '2rem'
  const myFunc = () => '4rem'

  return <div m={[mySpace, null, '-large', myFunc()]} px="small" />
}
