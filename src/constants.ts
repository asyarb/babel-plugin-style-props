import css from 'known-css-properties'
import camelCase from 'lodash.camelcase'

import { PluginOptions } from './'

export const INJECTED_PROP_NAME = '__styleProps__'

export const DEFAULT_OPTIONS = {
  prop: 'sx',
  psuedoClases: {
    hover: /Hover$/,
    focus: /Focus$/,
    active: /Active$/,
  },
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

const cssProperties = css.all.map(camelCase)

export const VALID_STYLE_NAMES = [
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
