import get from 'lodash.get'

const keys = {}

const setKeys = (key, props) =>
  props.forEach(prop => {
    keys[prop] = key
  })

// The order of these keys should generally match the keys found on the styled-system reference table. You can view the reference table at: https://styled-system.com/table/

// SPACE
setKeys('space', [
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'marginX',
  'marginY',
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'paddingX',
  'paddingY',
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
])

// COLOR
setKeys('colors', ['color', 'backgroundColor', 'borderColor'])

// TYPOGRAPHY
setKeys('fonts', ['fontFamily'])
setKeys('fontSizes', ['fontSize'])
setKeys('fontWeights', ['fontWeight'])
setKeys('lineHeights', ['lineHeight'])
setKeys('letterSpacing', ['letterSpacing'])

// LAYOUT
setKeys('sizes', [
  'width',
  'height',
  'minWidth',
  'maxWidth',
  'minHeight',
  'maxHeight',
])

// FLEXBOX -- needs no theme keys

// GRID LAYOUT
setKeys('space', [
  'gridGap',
  'gridRowGap',
  'gridColumnGap',
  'rowGap',
  'columnGap',
  'gap',
])

// BACKGROUND -- needs no theme keys

// BORDER
setKeys('borders', [
  'border',
  'borderTop',
  'borderRight',
  'borderBottom',
  'borderLeft',
])
setKeys('borderWidths', ['borderWidth'])
setKeys('borderStyles', ['borderStyle'])
setKeys('radii', ['borderRadius'])

// POSITION
setKeys('zIndices', ['zIndex'])
setKeys('space', ['top', 'right', 'bottom', 'left'])

// SHADOW
setKeys('shadows', ['boxShadow', 'textShadow'])

const getScaleValue = (scale, value) => {
  if (typeof value !== 'number' || value >= 0) return get(scale, value, value)

  const abs = Math.abs(value)
  const n = scale[abs] ?? abs

  return n * -1
}

export const css = styles => theme => {
  const result = {}

  for (const key in styles) {
    const value = styles[key]

    if (value && typeof value === 'object') result[key] = css(value)(theme)
    else result[key] = getScaleValue(theme[keys[key]] ?? {}, value)
  }

  return result
}

export default css
