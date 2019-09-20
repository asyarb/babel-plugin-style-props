export const getStaticValue = (theme, key, value) => {
  if (theme[key] && theme[key][value] !== undefined) return theme[key][value]

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

  if (theme[scaleKey] && theme[scaleKey][value] !== undefined)
    return theme[scaleKey][value][
      Math.min(mediaIndex, theme[scaleKey][value].length)
    ]

  if (theme[baseKey] && theme[baseKey][value] !== undefined)
    return theme[baseKey][value]

  return value
}
