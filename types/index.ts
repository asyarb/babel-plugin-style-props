import * as BabelTypes from '@babel/types'

export interface Babel {
  types: typeof BabelTypes
}

export interface PluginOptions {
  stripProps: boolean
  variants: {
    [key: string]: string
  }
}

export interface PluginContext extends PluginOptions {
  scopedProps: {
    [key: string]: any[]
  }
}
