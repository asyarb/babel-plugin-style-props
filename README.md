# Babel Plugin Style Props <!-- omit in toc -->

The base babel plugin for processing style props on JSX elements.

```jsx
<h1 mt={0} mb={4} color="primary" textDecoration="underline">
  Hello
</h1>
```

- [What does this plugin do?](#what-does-this-plugin-do)
  - [Currently released adapters](#currently-released-adapters)
- [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Configure Babel](#configure-babel)
    - [Removing style props](#removing-style-props)
- [Why?](#why)
  - [The performance problem](#the-performance-problem)
  - [Enter babel](#enter-babel)
  - [Going even further](#going-even-further)

## What does this plugin do?

This is the base style props plugin that parses style props on JSX elements and
adds them to that element under the `__styleProps__` JSXAttribute.

On its own, this plugin **does not** generate any CSS styles. This plugin only
parses style props and formats them in a standardized format. Doing this allows
for follow-up plugins to consume and generate styles from them in a way that
makes sense for that adapter.

See below for an example of the output of just this plugin:

```jsx
// input
<div
  color={['red', 'blue']}
  colorHover="blue"
  colorFocus="purple"
  pScale="xl"
/>

// Output
<div
  __styleProps__={{
    css: {
      base: [
        {
          color: 'red',
          margin: '-',
        },
        {
          color: 'blue',
        }
      ],
      hover: [
        {
          color: 'blue',
        },
      ],
      focus: [
        {
          color: 'purple',
        },
      ],
      active: [{}],
    },
    extensions: {
      scales: {
        padding: ['xl'],
      },
      variants: {},
    },
  }}
/>
```

### Currently released adapters

If you are looking for a plugin for style-props that will generate styles, see
the following list of currently available adapters:

- [babel-plugin-style-props-emotion](https://github.com/asyarb/babel-plugin-style-props-emotion)

## Getting Started

### Installation

```bash
# yarn
yarn add -D babel-plugin-style-props

# npm
npm i -D babel-plugin-style-props
```

### Configure Babel

Add the plugin to your Babel config file as shown below.

```js
// babel.config.js
module.exports = {
  presets: [
    '@babel/preset-env',
    '@babel/preset-react',
  ]
  plugins: ['babel-plugin-style-props'],
}
```

#### Removing style props

If you would like to remove any style props from the resulting JSX or HTML,
specify the `stripProps` option in your babel config.

```js
// babel.config.js
module.exports = {
  presets: [
    '@babel/preset-env',
    '@babel/preset-react',
  ]
  plugins: [['babel-plugin-style-props', { stripProps: true }]],
}
```

## Why?

### The performance problem

Writing and generating styles in JS is a pattern that has been becoming
increasingly common in React. A library named `styled-system` in conjunction
with libraries like `styled-components` and `emotion` popularized the approach
of generating styles based on props. Creating design systems utilizing the above
libraries has been seeing increased adoption in many implementations.

However, `styled-system` comes with the cost of a fairly non-trivial runtime. On
every render for an element, it needs to iterate over every style prop,
determine the appropriate theme keys and scales to utilize, access the theme
context's scales and values in a safe manner (specifially using `dlv`, a
relatively slow and recursive deep property accessor), generate style objects
from those theme values or fallbacks, and _finally_ have those objects parsed by
an underlying CSS-in-JS runtime to generate the final styles.

In small isolated cases, this can be okay, but when sites or applications have
hundreds of components, each using multiple style props, performance suffers.
This is especially noticable in key scenarios such as rehydration or when
rerenders are quickly occurring somewhere high in the React tree.

### Enter babel

This plugin originated from the hope of achieving the same API that
`styled-system` is able to achieve, but with a much lower or even eliminated
runtime cost. By utilizing babel, we can statically analyze style props and do
most of the work `styled-system` is doing at transpile time.

At transpile time, we can:

- Iterate over every style prop
- Determine the appropriate keys and scales to utilize
- Reduce the cost of safe theme property access through documented conventions
- Pre-generate style objects

By doing all the above, all that is left at runtime is to have the underlying
CSS-in-JS library generate the final styles. This means that we are able to
achieve a similar API to `styled-system` while having similar performance to
using a library like `emotion` directly!

### Going even further

You may be wondering: the above justification doesn't explain why this plugin is
architected in the way that it is. If we were just trying to achieve similar
performance to just using `emotion`, why not bundle that into one plugin? Why
split into this plugin and have a second plugin that runs afterward?

The answer to that is extensibility and flexibility.

By using this approach, we aren't limited to just utilizing a CSS-in-JS solution
such as `emotion` as a consumer of style props. By architecting our plugin in
this manner, we open the door for any alternative implementation based on the
values that come from style props.

To just put ideas of what could be possible using this approach:

- We could map style props to existing functional CSS frameworks like Tailwind
  CSS to reduce runtime even further.
- We could map style props to a zero-runtime CSS-in-JS library like `linaria`.
- We could generate class names at build time based on style props.
- We could perform partial static extraction on known staic properties, and rely
  on a runtime for dynamic expressions.
- Generate React Native styles based on style props.
