import cssProps from 'known-css-properties'
import camelCase from 'lodash.camelcase'
import { PluginOptions } from '../types'

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

export const THEME_MAP = {
  // SPACE
  padding: 'space',
  margin: 'space',
  marginTop: 'space',
  marginRight: 'space',
  marginBottom: 'space',
  marginLeft: 'space',
  marginX: 'space',
  marginY: 'space',
  paddingTop: 'space',
  paddingRight: 'space',
  paddingBottom: 'space',
  paddingLeft: 'space',
  paddingX: 'space',
  paddingY: 'space',
  m: 'space',
  mt: 'space',
  mr: 'space',
  mb: 'space',
  ml: 'space',
  mx: 'space',
  my: 'space',
  p: 'space',
  pt: 'space',
  pr: 'space',
  pb: 'space',
  pl: 'space',
  px: 'space',
  py: 'space',

  // COLOR
  color: 'colors',
  backgroundColor: 'colors',

  // TYPOGRAPHY
  fontFamily: 'fonts',
  fontSize: 'fontSizes',
  fontWeight: 'fontWeights',
  lineHeight: 'lineHeights',
  letterSpacing: 'letterSpacing',

  // LAYOUT
  width: 'sizes',
  height: 'sizes',
  minWidth: 'sizes',
  maxWidth: 'sizes',
  minHeight: 'sizes',
  maxHeight: 'sizes',

  // FLEXBOX -- needs no theme keys

  // GRID LAYOUT
  gridGap: 'space',
  gridRowGap: 'space',
  gridColumnGap: 'space',
  rowGap: 'space',
  columnGap: 'space',
  gap: 'space',

  // BACKGROUND -- needs no theme keys

  // BORDER
  border: 'borders',
  borderTop: 'borders',
  borderRight: 'borders',
  borderBottom: 'borders',
  borderLeft: 'borders',
  borderWidth: 'borderWidths',
  borderColor: 'colors',
  borderTopColor: 'colors',
  borderRightColor: 'colors',
  borderBottomColor: 'colors',
  borderLeftColor: 'colors',
  borderRadius: 'radii',

  // POSITION
  zIndex: 'zIndices',
  top: 'space',
  right: 'space',
  bottom: 'space',
  left: 'space',

  // SHADOW
  boxShadow: 'shadows',
  textShadow: 'shadows',
}

export const SCALE_THEME_MAP = Object.entries(THEME_MAP).reduce(
  (acc: { [key: string]: string }, [key, value]) => {
    acc[key] = value + 'Scales'

    return acc
  },
  {}
)
