# Babel plugin for Styled-System

Use Styled System props on any JSX element. This is a fork of the
`@styled-system/babel-plugin` but with the testing framework reimplemented to
better suit my personal style.

**Progress so far:**

- Added all missing properties from the `styled-system` reference table. Have
  their theme keys appropriately associated.
- Refactored testing to be more integration oriented. Tests now check against
  the final styles instead of comparing snapshots.
- CSS prop no longer utilizes a `css()` function to iterate over style keys.
  Instead, we just generate the inline arrow function callback that receives the
  theme like normal `css` prop usage. This ensures compatability with
  `styled-components` and `emotion` and _any_ object syntax support `css` prop.

**In progress now:**

- Add in the ability to specifiy variants

---

```jsx
<h1 mt={0} mb={4} color="primary">
  Hello
</h1>
```

- Use Styled System props on **any** JSX element.
- Support for **all** CSS properties.
- Picks up values from theme providers.
- Use arrays for responsive styles.
- Removes props from rendered HTML.

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
allowing libraries like Emotion to parse the styles into CSS.

```jsx
// in
<div color='tomato' px={32} />

// out (before Emotion's Babel plugin)
<div
  css={{
    color: 'tomato',
    paddingLeft: 32,
    paddingRight: 32,
  }}
/>
```

## Use values from your theme

When colors, fonts, font sizes, a spacing scale, or other values are definied in
an Emotion theme context, the values can be referenced by key in the props.

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

```jsx
<div width={['100%', '50%', '25%']} />
```

### Caveats

- Breakpoints can _only_ be configured in the Babel plugin options (this is an
  intentional performance enhancement).
- Theme values with _not_ work when a custom function is used in the `css` prop
- Does not parse props on SVG elements.
- This does not use the core `styled-system` package under the hood and is an
  alternative implementation. This is **not** intended to be used with
  components built with `styled-system` and may work differently than exppected.
- Does not transform fractional width values.
- Does not include default scales for `space` or `fontSizes`.

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

MIT License
