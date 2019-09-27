import cssProps from 'known-css-properties'
import camelCase from 'lodash.camelcase'
import { PluginOptions } from '../types'

export const STYLE_PROPS_ID = '__styleProps__'

export const DEFAULT_OPTIONS = {
  stripProps: false,
  variants: {},
} as PluginOptions

export const STYLE_ALIASES = {
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
} as { [key: string]: string | string[] }

const cssBlacklist = (x: string) => !['src', 'x', 'y', 'alt'].includes(x)
const cssProperties = cssProps.all.filter(cssBlacklist).map(camelCase)

const propNames = [
  ...cssProperties,

  // style specific props
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

export const STYLE_PROPS = propNames.reduce((acc, key) => {
  acc[key] = true

  return acc
}, {})

// TODO: Think about using regex Scale suffix instead of separate scale map.
export const SCALE_BASEPROP_MAP = propNames.reduce((acc, key) => {
  acc[key + 'Scale'] = key

  return acc
}, {})
