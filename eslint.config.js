const globals = require('globals');
const js = require('@eslint/js');

module.exports = [
    js.configs.recommended,
    {
        ignores: ['node_modules/*']
    },
    {
        languageOptions: {
            ecmaVersion: 2024,
            sourceType: 'commonjs',
            parserOptions: {
                ecmaFeatures: {
                    jsx: true
                }
            },
            globals: {
                ...globals.es2024,
                ...globals.node,
                ...globals.mocha
            }
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
            'no-unused-vars': ['error', { 'caughtErrors': 'none' }],
            'object-curly-spacing': ['error', 'always'],
            'quotes': ['error', 'single'],
            semi: ['error', 'always'],
            'space-before-function-paren': ['error', {
                anonymous: 'never',
                named: 'never',
                asyncArrow: 'always'
            }]
        }
    }
];
