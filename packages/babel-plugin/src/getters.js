export const getStaticValue = (theme, key, value) => {
  if (theme[key][value] !== undefined) return theme[key][value]

  return value
}

export const getDynamicValue = (
  theme,
  scaleKey,
  baseKey,
  value,
  mediaIndex
) => {
  if (value === undefined) return null

  if (theme[scaleKey][value] !== undefined)
    return theme[scaleKey][value][mediaIndex]

  if (theme[baseKey][value] !== undefined) return theme[baseKey][value]

  return value
}
