module.exports = {
	root: true,
	parser: 'babel-eslint',
	extends: [ 'wpcalypso', 'plugin:jsx-a11y/recommended', 'prettier' ],
	env: {
		browser: true,
		es6: true,
		mocha: true,
		node: true,
		jquery: true,
		jest: true,
	},
	parserOptions: {
		ecmaVersion: 2019,
		ecmaFeatures: {
			jsx: true,
		},
	},
	settings: {},
	plugins: [ 'jsx-a11y', 'lodash', 'jsdoc' ],
	rules: {
		// REST API objects include underscores
		camelcase: 0,
		'comma-spacing': 2,
		curly: 2,
		'computed-property-spacing': [ 2, 'always' ],
		'func-call-spacing': 2,
		'jsx-quotes': [ 2, 'prefer-double' ],
		'key-spacing': 2,
		'keyword-spacing': 2,
		'lodash/import-scope': [ 2, 'member' ],
		'max-len': 0, // Ignored for Jetpack
		'new-cap': [ 2, { capIsNew: false, newIsCap: true } ],
		'no-else-return': 2,
		'no-extra-semi': 2,
		'no-multiple-empty-lines': [ 2, { max: 1 } ],
		'no-multi-spaces': 2,
		'no-restricted-imports': [ 2, 'lib/sites-list', 'lib/mixins/data-observe' ],
		'no-restricted-modules': [ 2, 'lib/sites-list', 'lib/mixins/data-observe' ],
		'no-shadow': 2,
		'no-spaced-func': 2,
		'no-trailing-spaces': 2,
		// Allows Chai `expect` expressions
		'no-unused-expressions': 0,
		'no-var': 2,
		'object-curly-spacing': [ 2, 'always' ],
		'operator-linebreak': [
			2,
			'after',
			{
				overrides: {
					'?': 'before',
					':': 'before',
				},
			},
		],
		'padded-blocks': [ 2, 'never' ],
		'prefer-const': 2,
		semi: 2,
		'semi-spacing': 2,
		'space-before-blocks': [ 2, 'always' ],
		'space-in-parens': [ 2, 'always' ],
		'space-infix-ops': [ 2, { int32Hint: false } ],
		'space-unary-ops': [
			2,
			{
				overrides: {
					'!': true,
				},
			},
		],
		'wpcalypso/i18n-ellipsis': 2,
		'wpcalypso/i18n-no-collapsible-whitespace': 2,
		'wpcalypso/i18n-no-this-translate': 2,
		'wpcalypso/i18n-no-variables': 2,
		'wpcalypso/i18n-mismatched-placeholders': 2,
		'wpcalypso/import-docblock': 2,
		'wpcalypso/jsx-gridicon-size': 0, // Ignored for Jetpack
		'wpcalypso/jsx-classname-namespace': 0, // Ignored for Jetpack
		'jsx-a11y/label-has-for': [
			2,
			{
				required: {
					some: [ 'nesting', 'id' ],
				},
			},
		],
		// Disabled rules for now. Ideally we should resolve all the errors these rules create.
		'wpcalypso/redux-no-bound-selectors': 0,
		'jsx-a11y/anchor-has-content': 0,
		'react/no-string-refs': 0,
		'jsx-a11y/anchor-is-valid': 0,

		// JSDoc plugin overrides
		'jsdoc/check-alignment': 1, // Recommended
		'jsdoc/check-examples': 1,
		'jsdoc/check-indentation': 1,
		'jsdoc/check-param-names': 1, // Recommended
		'jsdoc/check-syntax': 1,
		'jsdoc/check-tag-names': 1, // Recommended
		'jsdoc/check-types': 1, // Recommended
		'jsdoc/implements-on-classes': 1, // Recommended
		'jsdoc/newline-after-description': 1, // Recommended
		'jsdoc/no-undefined-types': 1, // Recommended
		'jsdoc/require-description': 1,
		'jsdoc/require-hyphen-before-param-description': 1,
		'jsdoc/require-jsdoc': 1, // Recommended
		'jsdoc/require-param': 1, // Recommended
		'jsdoc/require-param-description': 1, // Recommended
		'jsdoc/require-param-name': 1, // Recommended
		'jsdoc/require-param-type': 1, // Recommended
		'jsdoc/require-returns': 1, // Recommended
		'jsdoc/require-returns-check': 1, // Recommended
		'jsdoc/require-returns-description': 1, // Recommended
		'jsdoc/require-returns-type': 1, // Recommended
		'jsdoc/valid-types': 1, // Recommended
		'jsdoc/check-values': 1,

		// eslint 6.x migration
		'no-unused-vars': 1,
		'no-useless-escape': 1,
		'no-extra-boolean-cast': 1,
		'no-case-declarations': 1,
		'no-class-assign': 1,
		'no-redeclare': 1,

		// Workaround for ESLint failing to parse files with template literals
		// with this error: "TypeError: Cannot read property 'range' of null"
		'template-curly-spacing': 'off',

		// Disabled pending #16099.
		'inclusive-language/use-inclusive-words': 0,
	},
};
