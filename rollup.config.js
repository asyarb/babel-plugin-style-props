import progress from 'rollup-plugin-progress'
import sourceMaps from 'rollup-plugin-sourcemaps'
import typescript from 'rollup-plugin-typescript2'

import pkg from './package.json'

const IS_PROD = process.env.NODE_ENV === 'production'

export default {
  input: 'src/index.ts',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      sourcemap: true,
    },
  ],
  external: [...Object.keys(pkg.dependencies || {}), '@babel/core'],
  plugins: [
    progress(),
    typescript({
      typescript: require('typescript'),
      clean: IS_PROD,
      objectHashIgnoreUnknownHack: true,
    }),
    sourceMaps(),
  ].filter(Boolean),
}
