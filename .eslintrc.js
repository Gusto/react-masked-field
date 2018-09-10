module.exports = {
  parser: 'typescript-eslint-parser',
  extends: 'gusto',
  plugins: [
    'typescript',
  ],
  env: {
    'browser': true,
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx']
      }
    },
  },
  rules: {
    'no-undef': 'off',
    'typescript/no-unused-vars': 'error',
    'import/extensions': ['error', 'always', {
      js: 'never',
      jsx: 'never',
      ts: 'never',
      tsx: 'never',
    }],
    'react/jsx-filename-extension': ['error', { extensions: ['.jsx', '.tsx'] }],
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: ['**/spec/**', 'karma.*.js'],
        optionalDependencies: false,
      },
    ],
  },
};
