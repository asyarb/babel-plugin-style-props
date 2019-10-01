import React from 'react'

export const Example = () => {
  return (
    <div
      color="red"
      colorHover="blue"
      __styleProps__={{
        css: {
          base: [
            {
              margin: 'red',
            },
          ],
          hover: [{}],
          focus: [{}],
          active: [{}],
        },
        extensions: {
          scales: {},
        },
      }}
    />
  )
}
