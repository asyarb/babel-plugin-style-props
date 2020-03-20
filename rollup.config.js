import progress from 'rollup-plugin-progress'
import sourceMaps from 'rollup-plugin-sourcemaps'
import typescript from '@rollup/plugin-typescript'

import pkg from './package.json'

const IS_PROD = process.env.NODE_ENV === 'production'

export default {
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'cjs',
    sourcemap: true,
  },
  external: [...Object.keys(pkg.dependencies || {}), '@babel/core'],
  plugins: [progress(), typescript(), sourceMaps()].filter(Boolean),
}
