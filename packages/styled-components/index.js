import React from 'react'

export const Hello = ({ innerProps, ...props }) => {
  return <div m={[null, '2rem', null, '4rem']} {...innerProps} {...props} />
}
