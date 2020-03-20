module.exports = {
  plugins: [
    '@babel/plugin-syntax-jsx',
    [
      'babel-plugin-style-props',
      {
        variants: {
          boxStyle: 'boxStyles',
        },
      },
    ],
  ],
}
