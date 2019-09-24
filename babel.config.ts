export default {
  env: {
    test: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              chrome: 76,
            },
          },
        ],
      ],
      plugins: ['@babel/plugin-syntax-jsx'],
    },
  },
}
