const sizes = {
  small: '40rem',
  medium: '48rem',
  large: '64rem',
  xlarge: '72rem',
}
const breakpoints = Object.values(sizes)

export const theme = {
  breakpoints,

  colors: {
    black: '#333',
    white: '#FFF',
    myColor: '#000',
  },

  shadows: {
    card: 'rgba(0, 0, 0, 0.15) 0px 20px 40px',
    inset: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  },

  lineHeights: {
    solid: 1,
    title: 1.25,
    copy: 1.5,
    wide: 1.75,
  },

  fonts: {
    sans: 'system-ui, sans-serif',
    serif: 'serif',
  },
  fontSizes: [
    '.75rem',
    '.875rem',
    '1rem',
    '1.125rem',
    '1.25rem',
    '1.5rem',
    '1.875rem',
    '2.25rem',
    '3rem',
    '4rem',
  ],
  fontWeights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    heavy: 800,
  },

  space: [
    0,
    '.25rem',
    '.375rem',
    '.5rem',
    '.75rem',
    '1rem',
    '1.25rem',
    '1.5rem',
    '2rem',
    '2.5rem',
    '3rem',
    '4rem',
    '5rem',
    '6rem',
    '8rem',
    '10rem',
    '12rem',
    '14rem',
    '16rem',
  ],
  sizes,

  boxStyles: {
    primary: {
      backgroundColor: 'black',
      color: 'white',
    },
    secondary: {
      backgroundColor: 'white',
      color: 'black',
    },
  },

  textStyles: {
    caps: {
      textTransform: 'uppercase',
    },
    trackedCaps: {
      textTransform: 'uppercase',
      letterSpacing: '0.02em',
    },
  },

  mediaQueries: Object.keys(sizes).reduce((acc, key) => {
    acc[key] = `@media (min-width: ${sizes[key]})`

    return acc
  }, {}),
}

theme.space.large = theme.space[8]
