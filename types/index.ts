import * as BabelTypes from '@babel/types'

export interface Babel {
  types: typeof BabelTypes
}

export type StylePropExpression = null | BabelTypes.Expression

export interface PluginOptions {
  stripProps: boolean
  variants: {
    [key: string]: string
  }
}
