module.exports = {
  '*.{js,jsx}': [
    `eslint --format ${
      require.resolve('eslint-friendly-formatter')
    } --fix`,
    'git add'
  ]
}
