# Babel plugin for Styled-System <!-- omit in toc -->

Use Styled System props on any JSX element.

```jsx
<h1 mt={0} mb={4} color="primary">
  Hello
</h1>
```

- Support for **all** CSS properties.
- Reads values from your `<ThemeProvider>`.
- Use arrays for responsive styles.
- Removes props from rendered HTML (if using `emotion`).
- Performant! Removes the additional runtime overhead of `styled-system`.

## Differences from official experiment

- [x] Added all missing properties from the `styled-system` reference table.
      Have their theme keys appropriately associated.
- [x] Refactored testing to be more integration oriented. Tests now check
      against the final styles instead of comparing snapshots.
- [x] No longer utilizes a `css()` function to recursively iterate over style
      keys. Instead, this version uses an inline arrow function that receives
      the theme like normal `css` prop usage. This ensures compatability with
      `styled-components`, `emotion` and _any_ `css` prop that supports object
      syntax.
- [x] Transform responsive array values to `theme.SPACE_KEY.value` identifiers.
- [x] Drop expressions and identifiers in system-props as is
- [x] Support negative values
- [x] Support responsive negative values
- [x] Eliminate runtime of iterating over style props & keys.
- [ ] Ability to specifiy variants through plugin options
- [ ] Ability to use css prop with destructuring.

## Getting Started

Add the plugin to your Babel config. Be sure that
`@emotion/babel-preset-css-prop` is included as well.

```js
// babel.config.js
module.exports = {
  presets: [
    '@babel/preset-env',
    '@babel/preset-react',
    '@emotion/babel-preset-css-prop',
  ],
  plugins: ['@styled-system/babel-plugin'],
}
```

Use Styled System props or CSS properties as React props on any JSX element.

```jsx
<h1
  color="tomato"
  fontFamily="system-ui"
  textDecoration="underline"
  textDecorationStyle="wavy"
/>
```

## What it does

`@styled-system/babel-plugin` converts style props to objects in a `css` prop,
allowing libraries like `styled-components` or `emotion` to parse the styles
into CSS.

```jsx
// in
<div color='red' px={5} />

// out (SC, before their babel plugin)
<div
  css={p.theme => ({
    color: p.theme.colors.red,
    paddingLeft: p.theme.space[5],
    paddingRight: p.theme.space[5],
  })}
/>

// out (emotion, before their babel plugin)
<div
  css={theme => ({
    color: theme.colors.red,
    paddingLeft: theme.space[5],
    paddingRight: theme.space[5],
  })}
/>
```

## Use values from your theme

When colors, fonts, font sizes, a spacing scale, or other values are definied in
an `<ThemeProvider>` context, the values can be referenced by key in the props.

```js
// example theme
export default {
  colors: {
    primary: '#07c',
    muted: '#f6f6f9',
  },
}
```

```jsx
<div color="primary" bg="muted" />
```

## Use arrays for responsive styles

Just like with `styled-system`, you can use arrays to specify responsive styles.

```jsx
<div width={['100%', '50%', '25%']} />
```

## Gotchas

- Breakpoints can **only** be configured in the Babel plugin options (this is an
  intentional performance enhancement).
- Expressions are dropped into the `css` prop as is.
- Incompatible with components built with `styled-system`.

## Limitations compared to `styled-system`

- Cannot use or specify variants. This is a work in progress.
- Cannot use `theme` keys that begin with `-`. This plugin relies on the `-`
  preceeding a theme key to determine the negation of a scale.
- Does not transform fractional width values.
- Does not include a default theme.
- Does not parse props on SVG elements.

To configure custom breakpoint values, set the `breakpoints` option in your
Babel config file.

```js
// babel.config.js
module.exports = {
  presets: [
    '@babel/preset-env',
    '@babel/preset-react',
    '@emotion/babel-preset-css-prop',
  ],
  plugins: [
    [
      '@styles-system/babel-plugin',
      {
        breakpoints: ['32em', '48em', '64em', '72em'],
      },
    ],
  ],
}
```

## License

MIT.
