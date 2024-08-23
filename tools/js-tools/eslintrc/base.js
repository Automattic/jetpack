// eslint config for normal projects. If for some reason you can't just inherit from .eslintrc.js, extend this instead of .eslintrc.js, probably like this:
//
// ```
// const loadIgnorePatterns = require( 'jetpack-js-tools/load-eslint-ignore.js' );
// module.exports = {
// 	root: true,
// 	extends: [ require.resolve( 'jetpack-js-tools/eslintrc/base' ) ],
// 	ignorePatterns: loadIgnorePatterns( __dirname ),
// 	parserOptions: {
// 		babelOptions: {
// 			configFile: require.resolve( './babel.config.js' ),
// 		},
// 	},
// };
// ```

/**
 * @type {import("eslint").Linter.Config}
 */
const restrictedPaths = [
	'lib/sites-list',
	'lib/mixins/data-observe',
	{
		name: 'classnames',
		message:
			"Please use `clsx` instead. It's a lighter and faster drop-in replacement for `classnames`.",
	},
];

module.exports = {
	parser: '@typescript-eslint/parser',
	extends: [
		'./preload',
		'eslint:recommended',
		// Can't just `@wordpress/recommended-with-formatting` because that includes React too and we only want that in ./react.js.
		'plugin:@wordpress/jsx-a11y',
		'plugin:@wordpress/custom',
		'plugin:@wordpress/esnext',
		'plugin:@wordpress/i18n',
		'plugin:jsx-a11y/recommended',
		'plugin:prettier/recommended',
	],
	env: {
		browser: true,
		es6: true,
		node: true,
		jquery: true,
		jest: true,
	},
	parserOptions: {
		ecmaVersion: 2019,
		ecmaFeatures: {
			jsx: true,
		},
		requireConfigFile: false,
	},
	settings: {
		'import/resolver': {
			// Check package.json exports. See https://github.com/import-js/eslint-plugin-import/issues/1810.
			[ require.resolve( 'eslint-import-resolver-exports' ) ]: {
				extensions: [ '.js', '.jsx', '.ts', '.tsx' ],
				conditions: process.env.npm_config_jetpack_webpack_config_resolve_conditions
					? process.env.npm_config_jetpack_webpack_config_resolve_conditions.split( ',' )
					: [],
			},
			// Check normal node file resolution.
			node: {
				extensions: [ '.js', '.jsx', '.ts', '.tsx' ],
			},
		},
		jsdoc: {
			preferredTypes: {
				// Override @wordpress/eslint-plugin, we'd rather follow jsdoc and typescript in this.
				object: 'object',
				Object: 'object',
				'object.<>': 'Object<>',
				'Object.<>': 'Object<>',
				'object<>': 'Object<>',
			},
		},
	},
	overrides: [
		{
			files: [ '*.ts', '*.tsx' ],
			extends: './typescript',
		},
		{
			files: [
				// Note: Keep the patterns here in sync with tools/js-tools/jest/config.base.js.
				'**/__tests__/**/*.[jt]s?(x)',
				'**/?(*.)+(spec|test).[jt]s?(x)',
				'**/test/*.[jt]s?(x)',
			],
			extends: [ require.resolve( 'jetpack-js-tools/eslintrc/jest' ) ],
		},
	],
	plugins: [ 'import', 'prettier', 'jsx-a11y', 'lodash', 'jsdoc' ],
	rules: {
		// Dummy domain, projects should override this in their own .eslintrc.js.
		'@wordpress/i18n-text-domain': [
			'error',
			{
				allowedTextDomain: "no text domain is set in this in this project's .eslintrc.js",
			},
		],

		// REST API objects include underscores
		camelcase: 'off',
		'comma-spacing': 'error',
		'computed-property-spacing': [ 'error', 'always' ],
		curly: 'error',
		'func-call-spacing': 'error',
		'import/order': [
			'error',
			{
				alphabetize: { order: 'asc' },
				groups: [ 'builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type' ],
				'newlines-between': 'never',
			},
		],

		'jsdoc/check-indentation': [
			'warn',
			{
				excludeTags: [
					'example',
					// Tags aligned by jsdoc/check-line-alignment from @wordpress/eslint-plugin.
					'param',
					'arg',
					'argument',
					'property',
					'prop',
				],
			},
		],
		'jsdoc/check-syntax': 'warn',
		'jsdoc/check-tag-names': [ 'error', { definedTags: [ 'jest-environment' ] } ],
		'jsdoc/check-values': 'warn',
		'jsdoc/no-multi-asterisks': [ 'error', { preventAtMiddleLines: true } ],
		'jsdoc/require-description': 'warn',
		'jsdoc/require-hyphen-before-param-description': 'warn',
		'jsdoc/require-jsdoc': 'warn',
		'jsdoc/require-param-description': 'warn',
		'jsdoc/require-returns': 'warn',
		'jsdoc/require-yields': 'warn',

		'jsx-a11y/anchor-has-content': 'off',
		'jsx-a11y/anchor-is-valid': 'off',
		'jsx-a11y/label-has-for': [
			'error',
			{
				required: {
					some: [ 'nesting', 'id' ],
				},
			},
		],
		// Redundant roles are sometimes necessary for screen reader support. For instance, VoiceOver
		// on Safari requires `role=list` to announce the list if the style is overwritten.
		'jsx-a11y/no-redundant-roles': 'off',

		'jsx-quotes': [ 'error', 'prefer-double' ],
		'key-spacing': 'error',
		'keyword-spacing': 'error',
		'lodash/import-scope': [ 'error', 'member' ],
		'new-cap': [ 'error', { capIsNew: false, newIsCap: true } ],
		'no-extra-semi': 'error',
		'no-multi-spaces': 'error',
		'no-multiple-empty-lines': [ 'error', { max: 1 } ],
		'no-new': 'error',
		'no-process-exit': 'error',
		'no-restricted-imports': [
			'error',
			{
				paths: restrictedPaths,
			},
		],
		'no-restricted-modules': [
			'error',
			{
				paths: restrictedPaths,
			},
		],
		'no-spaced-func': 'error',
		'no-trailing-spaces': 'error',
		'object-curly-spacing': [ 'error', 'always' ],
		'operator-linebreak': [
			'error',
			'after',
			{
				overrides: {
					'?': 'before',
					':': 'before',
				},
			},
		],
		'padded-blocks': [ 'error', 'never' ],
		'prefer-const': [ 'error', { destructuring: 'any' } ],
		semi: 'error',
		'semi-spacing': 'error',
		'space-before-blocks': [ 'error', 'always' ],
		'space-in-parens': [ 'error', 'always' ],
		'space-infix-ops': [ 'error', { int32Hint: false } ],
		'space-unary-ops': [
			'error',
			{
				overrides: {
					'!': true,
				},
			},
		],
		strict: [ 'error', 'never' ],

		// Temporarily override plugin:@wordpress/* so we can clean up failing stuff in separate PRs.
		'array-callback-return': 'off',
		eqeqeq: [ 'error', 'allow-null' ],
		'jsx-a11y/label-has-associated-control': [ 'error', { assert: 'either' } ],
		'no-prototype-builtins': 'off',
		'no-undef-init': 'off',
		'no-unused-expressions': 'off',
		'object-shorthand': 'off',
		'@wordpress/no-base-control-with-label-without-id': 'off',
		'@wordpress/no-global-active-element': 'off',
		'@wordpress/no-global-get-selection': 'off',
		'@wordpress/no-unused-vars-before-return': 'off',
	},
};
