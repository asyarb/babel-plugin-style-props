import React from 'react'

export const Example = () => {
  return (
    <div
      lineHeight={[1, 1.5]}
      colorScale={['red', 'blue']}
      hello={true}
      __styleProps__={{
        css: {
          base: [
            {
              margin: 'l',
            },
            {},
            {
              margin: 'xl',
            },
          ],
        },
        extensions: {
          scales: {
            padding: ['l', null, 'xl'],
          },
        },
      }}
    />
  )
}
