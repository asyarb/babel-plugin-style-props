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
    gray: {
      90: '#F7FAFC',
      80: '#EDF2F7',
      70: '#E2E8F0',
      60: '#CBD5E0',
      50: '#A0AEC0',
      40: '#718096',
      30: '#4A5568',
      20: '#2D3748',
      10: '#1A202C',
    },
    green: {
      90: '#F0FFF4',
      80: '#C6F6D5',
      70: '#9AE6B4',
      60: '#68D391',
      50: '#48BB78',
      40: '#38A169',
      30: '#2F855A',
      20: '#276749',
      10: '#22543D',
    },
    purple: {
      90: '#FAF5FF',
      80: '#E9D8FD',
      70: '#D6BCFA',
      60: '#B794F4',
      50: '#9F7AEA',
      40: '#805AD5',
      30: '#6B46C1',
      20: '#553C9A',
      10: '#44337A',
    },
    indigo: {
      90: '#EBF4FF',
      80: '#C3DAFE',
      70: '#A3BFFA',
      60: '#7F9CF5',
      50: '#667EEA',
      40: '#5A67D8',
      30: '#4C51BF',
      20: '#434190',
      10: '#3C366B',
    },
    blue: {
      90: '#EBF8FF',
      80: '#BEE3F8',
      70: '#90CDF4',
      60: '#63B3ED',
      50: '#4299E1',
      40: '#3182CE',
      30: '#2B6CB0',
      20: '#2C5282',
      10: '#2A4365',
    },
    red: {
      90: '#FFF5F5',
      80: '#FED7D7',
      70: '#FEB2B2',
      60: '#FC8181',
      50: '#F56565',
      40: '#E53E3E',
      30: '#C53030',
      20: '#9B2C2C',
      10: '#742A2A',
    },
    yellow: {
      90: '#FFFFF0',
      80: '#FEFCBF',
      70: '#FAF089',
      60: '#F6E05E',
      50: '#ECC94B',
      40: '#D69E2E',
      30: '#B7791F',
      20: '#975A16',
      10: '#744210',
    },
    teal: {
      90: '#E6FFFA',
      80: '#B2F5EA',
      70: '#81E6D9',
      60: '#4FD1C5',
      50: '#38B2AC',
      40: '#319795',
      30: '#2C7A7B',
      20: '#285E61',
      10: '#234E52',
    },
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
