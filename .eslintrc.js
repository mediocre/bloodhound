module.exports = {
    env: {
        es6: true,
        mocha: true,
        node: true
    },
    extends: 'eslint:recommended',
    parserOptions: {
        ecmaVersion: 2019
    },
    rules: {
        'brace-style': ['error', '1tbs', { allowSingleLine: true }],
        'comma-dangle': 'error',
        'dot-notation': 'error',
        'indent': ['error', 4, { 'SwitchCase': 1 }],
        'linebreak-style': 'error',
        'no-array-constructor': 'error',
        'no-console': 'error',
        'no-inline-comments': 'error',
        'no-trailing-spaces': 'error',
        'object-curly-spacing': ['error', 'always'],
        'quotes': ['error', 'single']
    }
}