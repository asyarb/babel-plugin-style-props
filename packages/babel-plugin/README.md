# Babel Plugin Style Props <!-- omit in toc -->

Use theme aware style props on any JSX element.

```jsx
<h1 mt={0} mb={4} color="primary" textDecoration="underline">
  Hello
</h1>
```

- [Features](#features)
- [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Configure Babel](#configure-babel)
    - [Styled Components](#styled-components)
    - [Emotion](#emotion)
  - [Setup your `<ThemeProvider>`](#setup-your-themeprovider)
    - [Minimal theme](#minimal-theme)
    - [Tailwind](#tailwind)
- [What this plugin does](#what-this-plugin-does)
- [Usage](#usage)
  - [Use values from your theme](#use-values-from-your-theme)
  - [Use function calls, variables, and expressions in style props](#use-function-calls-variables-and-expressions-in-style-props)
  - [Use arrays for responsive styles](#use-arrays-for-responsive-styles)
    - [Variables in responsive styles](#variables-in-responsive-styles)
  - [Use negative values](#use-negative-values)
    - [Negative values with variables and functions](#negative-values-with-variables-and-functions)
  - [Use custom variants](#use-custom-variants)
  - [Use styleScale props](#use-stylescale-props)
    - [Variables in styleScale props](#variables-in-stylescale-props)
      - [Referencing theme values in styleScale props](#referencing-theme-values-in-stylescale-props)
    - [Defining scales in your theme](#defining-scales-in-your-theme)
  - [Merges with existing `css` props.](#merges-with-existing-css-props)
    - [`css` prop syntax](#css-prop-syntax)
  - [Stripping props from HTML and JSX](#stripping-props-from-html-and-jsx)
- [Other gotchas](#other-gotchas)
  - [Breakpoints](#breakpoints)
  - [Nested theme properties](#nested-theme-properties)
  - [Incompatible with `defaultProps`](#incompatible-with-defaultprops)
  - [Incompatible with components built with `styled-system`](#incompatible-with-components-built-with-styled-system)
  - [Incompatible with theme keys that start with `-` (hypen)](#incompatible-with-theme-keys-that-start-with---hypen)
- [License](#license)

## Features

- Support for **all** CSS properties.
- Use values from your `<ThemeProvider>` and `theme`, or just use raw CSS units
  and properties.
- Use arrays for responsive styles.
- Performant. Close to using `styled-components` or `emotion` directly.
- Customizable variants.
- Optionally removes all style props from rendered HTML.

## Getting Started

### Installation

```bash
# yarn
yarn add -D babel-plugin-style-props

# npm
npm i -D babel-plugin-style-props
```

### Configure Babel

Add the plugin to your Babel config file and specify the `stylingLibrary`
option. Be sure that the appropriate `css` prop babel plugin is included
**after** this plugin.

See below for examples with popular CSS-in-JS libraries.

#### Styled Components

```js
// babel.config.js
module.exports = {
  presets: ['@babel/preset-env', '@babel/preset-react'],
  plugins: [
    [
      'babel-plugin-style-props',
      {
        stylingLibrary: 'styled-components'
      }
    ],
    'babel-plugin-styled-components'
  ]
}
```

#### Emotion

```js
// babel.config.js
module.exports = {
  presets: [
    '@babel/preset-env',
    '@babel/preset-react',
    '@emotion/babel-preset-css-prop'
  ],
  plugins: [
    [
      'babel-plugin-style-props',
      {
        stylingLibrary: 'emotion'
      }
    ]
  ]
}
```

### Setup your `<ThemeProvider>`

Place your `<ThemeProvider>` component around your React app as you normally
would, and pass your `theme` object.

```jsx
import { ThemeProvider } from 'styled-components'
import { theme } from './pathToYourTheme'

const YourApp = () => (
  <ThemeProvider theme={theme}>
    <App />
  </ThemeProvider>
)
```

#### Minimal theme

For a barebones theme to start working with, see this
[example](docs/examples/minimalTheme.js).

#### Tailwind

For a TailwindCSS copycat theme to get started with, see this
[example](docs/examples/tailwindTheme.js).

Your `theme` should follow the `styled-system` specification that you can find
detailed [here](https://styled-system.com/theme-specification).

## What this plugin does

`babel-plugin-style-props` converts style props to a function in the `css` prop.
This allows libraries like `styled-components` or `emotion` to parse the styles
into CSS.

```jsx
// Your JSX
<div color='red' px={5} />

// Output JSX (simplified): `emotion`
<div
  css={theme => ({
    color: theme.colors.red,
    paddingLeft: theme.space[5],
    paddingRight: theme.space[5],
  })}
/>

// Output JSX (simplified): `styled-components`
<div
  css={p => ({
    color: p.theme.colors.red,
    paddingLeft: p.theme.space[5],
    paddingRight: p.theme.space[5],
  })}
/>
```

## Usage

If you've used `styled-system` or any package based on it, this plugin's usage
should be largely familiar.

### Use values from your theme

When colors, fonts, font sizes, a spacing scale, or other values are definied in
a `<ThemeProvider>`, the values can be referenced by key in the props.

```jsx
// example theme
const theme = {
  // ...
  colors: {
    primary: '#07c',
    muted: '#f6f6f9',
  },
}

<div color="primary" bg="muted" />
```

### Use function calls, variables, and expressions in style props

Function calls, expressions, and variables are dropped into the `css` prop as
computed properties. Consider the following example:

```jsx
const Box = () => {
  const myColor = 'primary'
  const myFunction = () => 'muted'
  const boolean = true
  const size = 'small'

  return <div color={myColor} bg={myFunction()} mt={boolean ? 'large' : size} />
}

// transpiles to something like:
const Box = () => {
  const myColor = 'primary'
  const myFunction = () => 'muted'
  const boolean = true
  const size = 'small'

  return (
    <div
      css={theme => ({
        color: theme.colors[myColor], // theme.colors.primary
        backgroundColor: theme.colors[myFunction()], // theme.colors.muted
        marginTop: theme.space[boolean ? 'large' : size] // theme.space.large || theme.space.small
      })}
    />
  )
}
```

If you are using `styled-components`, this plugin will automatically handle
passing your functions, variables, and expressions as props to the `styled.div`
that is generated by `babel-plugin-styled-components`.

### Use arrays for responsive styles

You can use arrays to specify responsive styles.

```jsx
<div width={['100%', '50%', '25%']} />
```

Opt out of setting a value for a breakpoint by using `null`.

```jsx
<div width={[null, '50%', null, '25%']} />
```

Responsive arrays will generate styles according to the breakpoints defined in
your babel config. See [breakpoints](#breakpoints) for more info.

#### Variables in responsive styles

If you are using a variable in a style prop's responsive array, it **cannot** be
an array.

```jsx
const myValue = '1rem'
const myArray = ['1rem', '2rem', '3rem']

// This works:
<div m={[myValue, '2rem', '3rem']} />

// This does not:
<div m={myArray} />
```

If you need to dynamically style a responsive array, please see
[Use styleScale props](#use-stylescale-props).

### Use negative values

When a style prop has keys that are defined in a `<ThemeProvider>`, you can
negate them by prefixing them with a '-' (hyphen).

```jsx
const theme = {
  // ...
  space: [
    0,
    '5rem'
  ]
}
// theme alias
theme.space.large = theme.space[1]

<div mt="-large" mr={-1} />

// transpiles to something like:
<div
  css={theme => ({
    marginTop: '-' + theme.space.large,
    marginRight: '-' + theme.space[1]
  })}
/>

// resulting in:
<div css={theme => ({ marginTop: '-5rem', marginRight: '-5rem' })} />
```

#### Negative values with variables and functions

Due to the nature of static compilation, using a negative theme key in a
variable or a return value of a function will **not** result in the negation of
a theme value.

```jsx
// This will NOT work.
const Box = ({ isNegative }) => {
  const mySpace = isNegative ? '-large' : 'large'

  return <div mx={mySpace}>
}
```

### Use custom variants

Custom variants and style props can be defined in the babel plugin options under
`variants`. See below for an example config:

```js
// babel.config.js
module.exports = {
  presets: ['@babel/preset-env', '@babel/preset-react'],
  plugins: [
    [
      'babel-plugin-style-props',
      {
        stylingLibrary: 'styled-components',
        variants: {
          boxStyle: 'boxStyles'
        }
      }
    ],
    'babel-plugin-styled-components'
  ]
}
```

The above config will tell `babel-plugin-style-props` to transpile the
`boxStyle` prop on any JSX element to properties in the `css` prop.

```jsx
const theme = {
  // ...
  boxStyles: {
    primary: {
      color: 'white',
      backgroundColor: '#f0f'
    }
  }
}

// `boxStyle` on an element:
<div boxStyle="primary" />

// will transpile to something like:
<div css={theme => ({ ...theme.boxStyles.primary })} />

// which results in:
<div css={theme => ({ color: 'white', backgroundColor: '#f0f' })} />
```

Currently, variants can only specify raw CSS rules (no theme values). In the
future, they will be able to support `theme` values.

### Use styleScale props

Use `scale` variants for any themeable style prop. `scale` style props allow you
to specify a set of responsive values for a style prop in a single key, or a via
an array of keys and/or values.

This is useful for styles that usually change at every breakpoint such as font
sizes or space values, or when you need to dynamically assign breakpoint values
since normal style props cannot accept dynamic arrays.

See below for an example:

```jsx
<div mScale="xl" />

// transpiles to something like
<div
  css={theme => ({
    margin: theme.spaceScales.xl[0],
    "@media (min-width: 40em)": {
      margin: theme.spaceScales.xl[1]
    },
    "@media (min-width: 52em)": {
      margin: theme.spaceScales.xl[2]
    },
    "@media (min-width: 64em)": {
      margin: theme.spaceScales.xl[3]
    }
  })}
/>
```

Like with normal style props, `scale` props can be overridden per breakpoint
using an array, be negated with a `-`, and can use `null` to skip over
breakpoints.

```jsx
<div mScale={['xl', null, '-l']} />

// transpiles to something like
<div
  css={theme => ({
    margin: theme.spaceScales.xl[0],
    "@media (min-width: 40em)": {
      margin: theme.spaceScales.xl[1]
    },
    "@media (min-width: 52em)": {
      margin: theme.spaceScales.xl[2]
    },
    "@media (min-width: 64em)": {
      margin: "-" + theme.spaceScales.l[3]
    }
  })}
/>
```

Note how the `xl` scale still persists through the second and third breakpoint.
Using scales, we can persist a scale for as long as we need it, then override it
when necessary!

#### Variables in styleScale props

Any variable passed to a `styleScale` prop **must** be an array (or function
returning an array). This array also currently cannot contain `null` to skip
over breakpoints. If you need to skip a breakpoint, just pass the same key again
in the responsive array.

Consider this example:

```jsx

// This works:
const myScale = ['xl', 'l', 'l', 'xl']
<div mScale={myScale} />

// This does not work:
const myBadScale = ['xl', 'l', null, 'xl']
<div mScale={myBadScale} />
```

##### Referencing theme values in styleScale props

Any dynamic array passed to a `styleScale` prop has access to the non-scaled
`theme` equivalent. This means that if you are passing a dynamic array to the
`colorScale` prop, it will first check if that `colorsScales` property exists,
fallback and check normal `colors`, then finally use the raw value if neither
would work.

Consider this example:

```jsx
const theme = {
  // ...
  colors: {
    primary: 'red'
  }
  colorsScale: {
    secondary: ['blue', 'green', 'black', 'white']
  }
}

const colors = ['primary', 'secondary', 'secondary', '#fff']
<div colorScale={colors} />

// results in something like
<div
  css={theme => ({
    color: theme.colors.primary,
    "@media (min-width: 40em)": {
      color: theme.colorsScales.secondary[1]
    },
    "@media (min-width: 52em)": {
      color: theme.colorsScales.secondary[2]
    },
    "@media (min-width: 64em)": {
      color: '#fff'
    }
  })}
/>
```

#### Defining scales in your theme

Scales follow the same theme specification as detailed above, except each theme
key has `Scales` appended to it. For example, to define the scales for font
sizes, it would exist in your theme as `fontSizesScales`. The associated prop
would be `fontSizeScale`.

```jsx
const theme = {
  fontSizesScales: {
    l: ['1rem', '1.15rem', '1.35rem', '1.5rem']
  }
}

<p fontSizeScale="l" />
```

### Merges with existing `css` props.

If a JSX element already has a `css` prop defined, this plugin will merge your
style prop styles with existing styles in a `css` prop. Styles in a `css` prop
will take priority over styles from style props.

```jsx
<div
  m="3rem"
  lineHeight={1.5}
  css={{
    color: 'red',
    backgroundColor: 'blue'
  }}
/>

// will result in something like:
<div
  css={theme => ({
    margin: '3rem',
    lineHeight: 1.5,
    color: 'red',
    backgroundColor: 'blue'
  })}
/>
```

#### `css` prop syntax

This plugin will properly merge your styles as long as the existing `css` prop
is written using object syntax or with a function call. Currently, merging with
tagged template literals is **not supported**.

```jsx
// Plain object - can merge
<div
  css={{
    color: 'red'
  }}
/>

// Arrow function - can merge
<div
  css={theme => ({
    color: 'red'
  })}
/>

// Arrow function with return - can merge
<div
  css={theme => {
    return {
      color: 'red'
    }
  }}
/>

// Function - can merge
<div
  css={function(theme) {
    return {
      color: 'red'
    }
  }}
/>

// Destructured properties, arrow and plain - can merge
<div
  css={({ colors }) => {
    color: colors.red
  }}
/>

// Tagged template literal - CANNOT MERGE
<div
  css={`
    color: red;
  `}
/>
```

### Stripping props from HTML and JSX

If you would like this babel plugin to strip all style-props from your resulting
code and HTML, specify `shouldStripProps` in your plugin options.

```js
// babel.config.js
module.exports = {
  presets: ['@babel/preset-env', '@babel/preset-react'],
  plugins: [
    [
      'babel-plugin-style-props',
      {
        stylingLibrary: 'styled-components',
        variants: {
          boxStyle: 'boxStyles'
          shouldStripProps: true
        }
      }
    ],
    'babel-plugin-styled-components'
  ]
}
```

## Other gotchas

To achieve a similar API to `styled-system`/`theme-ui` without the performance
cost, this plugin makes some opinionated decisions as to how you can structure
your theme.

### Breakpoints

Breakpoints can **only** be configured in the Babel plugin options. See below
for an example.

```js
// babel.config.js
module.exports = {
  presets: ['@babel/preset-env', '@babel/preset-react'],
  plugins: [
    [
      'babel-plugin-style-props',
      {
        stylingLibrary: 'styled-components',
        breakpoints: ['32rem', '60rem', '100rem']
      }
    ],
    'babel-plugin-styled-components'
  ]
}
```

### Nested theme properties

This plugin **only** supports two levels of nesting in a `theme` object.
Consider the following example.

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

<div color="red.light" bg="primary" />
```

The above example will not work because we are accessing a third level of
nesting for our `color` style prop. This is largely how this plugin eliminates
the `styled-system`/`theme-ui` runtime cost.

If you want to have namespaced-like behavior, consider flatly namespacing your
keys as a workaround.

```js
const theme = {
  colors: {
    primary: '#fff',

    'red.light': '#f0f',
    'red.dark': '#0f0'
  },
  lineHeights: {
    copy: 1.5
  }
}
```

### Incompatible with `defaultProps`

This plugin does not support specifying React's `defaultProps` for style props.
`defaultProps` get injected into components at run-time, and therefore cannot be
transpiled by our babel plugin.

If you are composing re-usable components with defaults using this plugin, it's
recommended to just set your defaults directly in conjunction with prop
spreading.

```jsx
// Grid.js
const Grid = ({ children, ...props }) => {
  return (
    <div display="grid" {...props}>
      {children}
    </div>
  )
}

const Example = () => {
  return (
    <Grid gridTemplateColumns="1fr 1fr" gridColumnGap="1rem">
      <div justifySelf="end">Default</div>
      <div alignSelf="start">Props!</div>
    </Grid>
  )
}
```

### Incompatible with components built with `styled-system`

Due to this plugin transpiling away style props, this plugin is incompatibile
with any component that is built with `styled-system` **or** any component that
uses any of the expected style prop names.

> In general, a style prop is the `camelCase` equivalent of any CSS property
> name.

### Incompatible with theme keys that start with `-` (hypen)

This plugin relies on the hyphen preceeding a theme key to determine the
negation of a scale.

## License

MIT.
