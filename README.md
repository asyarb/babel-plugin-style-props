# Babel Plugin Style Props <!-- omit in toc -->

The base babel plugin for processing enhanced style props on JSX elements.

```jsx
<h1 sx={{ mt: 0, mb: 4, color: 'primary', textDecoration: 'underline' }}>
  Hello World!
</h1>
```

- [What does this plugin do?](#what-does-this-plugin-do)
  - [Currently released adapters](#currently-released-adapters)
- [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Configure Babel](#configure-babel)
    - [Configuration Options](#configuration-options)
- [Why?](#why)
  - [The performance problem](#the-performance-problem)
  - [Enter Babel](#enter-babel)
  - [Taking Things Further](#taking-things-further)

## What does this plugin do?

This is the base plugin that parses style props on JSX elements and injects them
as a new `__styleProps__` prop.

On its own, this plugin **does not** generate any CSS styles. This plugin only
parses styles from a pre-defined prop and re-formats them into a standardized
format. This allows for follow-up adapter babel plugins to consume and generate
styles from them in a way that makes sense for that particular implementation.

See below for an example of the output of just this plugin:

```jsx
// input
<div
  sx={{
    color: ['red', 'blue'],
    colorHover: 'blue',
    colorFocus: 'purple',
    pScale: 'xl'
  }}
/>

// Output
<div
  __styleProps__={{
    base: [
      {
        color: 'red',
      },
      {
        color: 'blue',
      },
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
    scales: [
      {
        padding: ['xl'],
      },
    ],
    variants: [{}],
  }}
/>
```

### Currently released adapters

If you are looking for an adapter plugin for that will generate styles, see the
following list of currently available adapters:

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

#### Configuration Options

## Why?

### The performance problem

Writing and generating styles in JS is becoming increasingly common in React.
Popular high-level libraries such as `styled-system` and `theme-ui` work in
conjunction with CSS-in-JS tools like `emotion` to provide ergonomic APIs for
styling components with props. Design systems utilizing the above libraries have
been seeing increased adoption in many teams and applications.

However, these sets of libraries come with the cost of a fairly non-trivial
runtime. On every render for a component, they need to:

1. Iterate over a collection of every style rule.
2. Determine the appropriate theme keys or scales to utilize.
3. Access the theme context's scales and values in a safe manner. (Usually with
   an implementation like `lodash.get` or `dlv`, both relatively slow and
   recursive deep property accessors)
4. Generate style objects from those values or fallbacks.
5. _Finally_ parse those objects with the underlying CSS-in-JS runtime and
   create the final styles for that element.

In small isolated cases, this amount of runtime work can be okay, but when sites
or applications have hundreds of components, each with large style declarations,
performance suffers. These runtime costs are especially noticable in key
scenarios such as rehydration or when rerenders are rapidly occurring.

### Enter Babel

In order to have access to the same ergonomic and high-level APIs that tools
like `styled-system` and `theme-ui` are able to achieve without sacrificing
performance, we need to think outside of the box. Instead of doing all that work
at runtime, what if we could do most of what we need to do up-front?

By utilizing a build time tool such as Babel, we can statically analyze style
declarations and do most of the work these high level libraries are doing at
build time.

At build time, we can:

1. Iterate over every style rule.
2. Determine the appropriate keys and scales to utilize from our theme.
3. Reduce the cost of safe property access via documented conventions.
4. Pre-generate style objects.

By doing all the above, all that is left at runtime is to have the underlying
CSS-in-JS library generate the final styles. With this, we are able to achieve a
high-level API while maintaining similar performance to using a library like
`emotion` directly!

### Taking Things Further

You may be wondering: the above doesn't explain why this plugin is architected
in the way that it is. If we're trying to achieve similar performance to just
using `emotion`, why not bundle that into one plugin? Why split this plugin and
have a second adapter that runs afterward?

The answer to that is extensibility.

By using this approach, we aren't limited to just utilizing a CSS-in-JS solution
such as `emotion` as a consumer of style props. In fact, we aren't limited to
CSS-in-JS at all!

With this approach, we open the door for future adapter implementations based on
the values that come from style props.

To put ideas of what could be possible using this approach:

- Styles can be mapped to existing functional CSS frameworks like TailwindCSS to
  reduce or even eliminate runtime cost entirely.
- Styles could be mapped to zero-runtime CSS-in-JS libraries like `linaria`,
  `treat` or `astroturf`.
- Class names can be generated at build time.
- Partial static extraction on known styles; rely on runtime for dynamic
  expressions.
- Unified React Native styling API at no additional performance cost.
