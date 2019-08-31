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
- Performant. No additional runtime overhead of `styled-system`. Equivalent perf
  to using `styled-components` or `emotion` directly.
- Removes props from rendered HTML (if using `emotion`).

## Differences from official experiment

- [x] Supports all missing properties from the `styled-system` reference table.
      Have their theme keys appropriately associated.
- [x] Refactored testing to be more integration oriented.
- [x] Eliminate `styled-system` runtime of iterating over style props & keys.
- [x] Transform keyable values to `theme.SPACE_KEY.value` object member
      expressions.
- [x] Drop-in expressions and identifiers in system-props into `css` prop as is.
- [x] Merges style props with existing `css` prop expressions and objects if
      already defined.
  - [x] Support and merge css prop function expressions with destructuring.
- [x] Support responsive negative values and theme keys.
- [x] Support responsive ternary operators with theme keys.
- [ ] Ability to specifiy custom variants through plugin options.

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

`@styled-system/babel-plugin` converts style props to objects in a `css` prop.
This allows libraries like `styled-components` or `emotion` to parse the styles
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
- Function expressions and plain variables are dropped into the `css` prop as is
  under the appropriate key.
- Incompatible with components built with `styled-system`.

## Limitations compared to `styled-system`

- Cannot specify `theme` keys that begin with `-`. This plugin relies on the `-`
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
