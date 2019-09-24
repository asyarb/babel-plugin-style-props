import * as BabelTypes from '@babel/types'

declare global {
  interface Babel {
    types: typeof BabelTypes
  }

  interface PluginOptions {
    stripProps: boolean
    variants: {
      [key: string]: string
    }
  }

  interface PluginContext extends PluginOptions {
    scopedProps: {
      [key: string]: any[]
    }
  }
}
