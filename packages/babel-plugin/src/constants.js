import camelCase from 'lodash.camelcase'
import cssProps from 'known-css-properties'
import isPropValid from '@emotion/is-prop-valid'

export const defaultOptions = {
  breakpoints: ['40em', '52em', '64em'],
}

const cssProperties = cssProps.all
  .filter(prop => !/^-/.test(prop))
  .map(camelCase)
  .filter(prop => !isPropValid(prop))

const propNames = [
  // props included in isPropValid
  ...cssProperties,

  // Missing props from cssProperties
  'color',
  'width',
  'height',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'fontStyle',
  'display',
  'opacity',
  'overflow',
  'textDecoration',
  'transform',
  'cursor',
  'filter',

  // system specific props
  'bg',
  'm',
  'mt',
  'mr',
  'mb',
  'ml',
  'mx',
  'my',
  'p',
  'pt',
  'pr',
  'pb',
  'pl',
  'px',
  'py',
  'marginX',
  'marginY',
  'paddingX',
  'paddingY',
]

export const props = propNames.reduce(
  (acc, key) => ({
    ...acc,
    [key]: true,
  }),
  {},
)

export const aliases = {
  bg: 'backgroundColor',
  m: 'margin',
  mt: 'marginTop',
  mr: 'marginRight',
  mb: 'marginBottom',
  ml: 'marginLeft',
  p: 'padding',
  pt: 'paddingTop',
  pr: 'paddingRight',
  pb: 'paddingBottom',
  pl: 'paddingLeft',

  // shorthands
  marginX: ['marginLeft', 'marginRight'],
  marginY: ['marginTop', 'marginBottom'],
  paddingX: ['paddingLeft', 'paddingRight'],
  paddingY: ['paddingTop', 'paddingBottom'],
  mx: ['marginLeft', 'marginRight'],
  my: ['marginTop', 'marginBottom'],
  px: ['paddingLeft', 'paddingRight'],
  py: ['paddingTop', 'paddingBottom'],
}
