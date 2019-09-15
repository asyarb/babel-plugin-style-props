import React from 'react'

export const Hello = ({ ...props }) => {
  return <div m={[null, '2rem', null, '4rem']} pScale="l" {...props} />
}
