# Babel plugin for Styled-System <!-- omit in toc -->

Use Styled System props on any JSX element.

```jsx
<h1 mt={0} mb={4} color="primary" textDecoration="underline">
  Hello
</h1>
```

- [Features](#features)
- [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Configure Babel](#configure-babel)
    - [Emotion](#emotion)
    - [Styled Components](#styled-components)
  - [Setup your `<ThemeProvider>`](#setup-your-themeprovider)
- [What this plugin does](#what-this-plugin-does)
- [Use values from your theme](#use-values-from-your-theme)
- [Use arrays for responsive styles](#use-arrays-for-responsive-styles)
- [Gotchas](#gotchas)
  - [Breakpoints](#breakpoints)
  - [Nested theme properties](#nested-theme-properties)
  - [Function calls and variables in style props](#function-calls-and-variables-in-style-props)
  - [Incompatible with components built with `styled-system`](#incompatible-with-components-built-with-styled-system)
- [Other limitations compared to `styled-system`](#other-limitations-compared-to-styled-system)
- [License](#license)

## Features

- Support for **all** CSS properties.
- Reads values from your `<ThemeProvider>`.
- Use arrays for responsive styles.
- Performant. No additional runtime overhead of `styled-system`. Equivalent perf
  to using `styled-components` or `emotion` with the `css` prop directly.
- Customizable variants.
- Removes style props from rendered HTML.

## Getting Started

### Installation

```bash
# yarn
yarn add -D @styled-system/babel-plugin

# npm
npm i -D @styled-system/babel-plugin
```

### Configure Babel

Add the plugin to your Babel config and specify the `stylingLibrary` option. Be
sure that the appropriate `css` prop babel plugin is included as well.

See below for examples with popular CSS-in-JS libraries.

#### Emotion

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
      '@styled-system/babel-plugin',
      {
        stylingLibrary: 'emotion',
      },
    ],
    'babel-plugin-styled-components',
  ],
}
```

#### Styled Components

```js
// babel.config.js
module.exports = {
  presets: ['@babel/preset-env', '@babel/preset-react'],
  plugins: [
    [
      '@styled-system/babel-plugin',
      {
        stylingLibrary: 'styled-components',
      },
    ],
    'babel-plugin-styled-components',
  ],
}
```

### Setup your `<ThemeProvider>`

Place your `<ThemeProvider>` component around your React app as you normally
would.

```jsx
import { ThemeProvider } from 'styled-components'
import { theme } from './pathToYourTheme'

const YourApp = () => (
  <ThemeProvider theme={theme}>
    <App />
  </ThemeProvider>
)
```

Your `theme` should follow the `styled-system` specification that you can find
detailed [here](https://styled-system.com/theme-specification).

## What this plugin does

`@styled-system/babel-plugin` converts style props to an object in a `css` prop.
This allows libraries like `styled-components` or `emotion` to parse the styles
into CSS.

```jsx
// in
<div color='red' px={5} />

// out (styled-components, before babel plugin)
<div
  css={theme => ({
    color: p.theme.colors.red,
    paddingLeft: p.theme.space[5],
    paddingRight: p.theme.space[5],
  })}
/>

// out (emotion, before babel plugin)
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
a `<ThemeProvider>` context, the values can be referenced by key in the props.

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

### Breakpoints

Unlike `styled-system`, breakpoints can **only** be configured in the Babel
plugin options. This is an intentional performance enhancement.

```js
// babel.config.js
module.exports = {
  presets: ['@babel/preset-env', '@babel/preset-react'],
  plugins: [
    [
      '@styled-system/babel-plugin',
      {
        stylingLibrary: 'styled-components',
        breakpoints: ['32rem', '60rem', '100rem'],
      },
    ],
    'babel-plugin-styled-components',
  ],
}
```

### Nested theme properties

For performance reasons, this plugin **only** supports two levels of nesting in
a `theme` object. Consider the following example.

```js
// theme.js
const theme = {
  colors: {
    primary: '#fff',
    red: {
      light: '#f0f',
      dark: '#0f0',
    },
  },
  lineHeights: {
    copy: 1.5,
  },
}

const Box = () => <div color="red.light" bg="primary" />
```

The above will not work because we are accessing a third level of nesting for
our `color` style prop. This is an intentional performance enhancement and
limitation of this plugin.

If you wish to have name-spaced keys like above, consider flatly namespacing
your keys instead.

```js
const theme = {
  colors: {
    primary: '#fff',

    'red.light': '#f0f',
    'red.dark': '#0f0',
  },
  lineHeights: {
    copy: 1.5,
  },
}
```

### Function calls and variables in style props

Function calls and variables are dropped into the `css` prop as computed
properties. Consider the following example:

```jsx
const myFunction = () => 'muted'

const Box = () => {
  const myColor = 'primary'

  return <div color={myColor} bg={myBackgroundFunction()} />
}

// Is equivalent to...

const Box = () => {
  const myColor = 'primary'

  return (
    <div
      css={theme => ({
        color: theme.colors[myColor], // theme.colors.primary
        backgroundColor: theme.colors[myFunction()], // theme.colors.muted
      })}
    />
  )
}
```

### Incompatible with components built with `styled-system`

Due to this plugin stripping style props from the final JavaScript, this plugin
is incompatibile with any component that is built with `styled-system` **or**
uses the same expected style prop names.

## Other limitations compared to `styled-system`

- Cannot specify `theme` keys that begin with `-`. This plugin relies on the `-`
  preceeding a theme key to determine the negation of a scale.
- Does not transform fractional width values.
- Does not include a default theme.
- Does not parse props on SVG elements.

## License

MIT.
