import pluginTester from 'babel-plugin-tester'
import babelConfig from '../babel.config'
import styleProps from '../src'

pluginTester({
  plugin: styleProps,
  babelOptions: babelConfig,
  snapshot: true,

  tests: {
    'runs without dying': {
      code: `
        const Box = () => {
          const boolean = false

          return <div mx={['3rem', null, '4rem']} lineHeight={boolean} />
        }
      `,
    },
  },
})
