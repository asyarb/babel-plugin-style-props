import React from 'react'

export const Hello = () => {
  const myColor = 'myColor'
  const myBackground = () => '#123456'

  return <div color={myColor} bg={myBackground()} lineHeight="copy" />
}
