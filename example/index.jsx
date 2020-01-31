import React from 'react'

export const Example = () => {
  return (
    <div
      m="-large"
      boxStyle="med"
      __styleProps__={{
        css: {
          base: [
            {
              color: 'red',
            },
          ],
          hover: [
            {
              color: 'blue',
            },
          ],
          focus: [
            {
              color: 'purple',
            },
          ],
          active: [
            {
              color: 'green',
            },
          ],
        },
        extensions: {
          scales: {
            margin: ['xl'],
          },
          variants: {
            boxStyles: 'large',
          },
        },
      }}
    />
  )
}
