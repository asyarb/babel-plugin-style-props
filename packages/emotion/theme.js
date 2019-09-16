export const theme = {
  colors: {
    black: '#333',
    white: '#FFF',
    myColor: '#000'
  },

  shadows: {
    card: 'rgba(0, 0, 0, 0.15) 0px 20px 40px',
    inset: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
  },

  lineHeights: {
    copy: 1.5
  },

  fonts: {
    sans: 'system-ui, sans-serif'
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
    '4rem'
  ],
  fontWeights: {
    normal: 400
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
    '16rem'
  ],
  spaceScales: {
    l: ['.5rem', '1rem', '1.5rem', '2rem'],
    xl: ['1rem', '2rem', '3rem', '4rem']
  },

  sizes: {
    small: '40rem'
  },

  boxStyles: {
    primary: {
      backgroundColor: 'black',
      color: 'white'
    }
  }
}

theme.space.large = theme.space[8]
