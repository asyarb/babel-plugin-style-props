import React from 'react'

export const Hello = ({ ...props }) => {
  return <div mt={['-3rem', null, '4rem']} mbScale="xl" {...props} />
}
