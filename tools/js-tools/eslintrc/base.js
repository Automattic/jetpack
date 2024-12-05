// eslint config for normal projects. If for some reason you can't just inherit from .eslintrc.js, extend this instead of .eslintrc.js, probably like this:
//
// ```
// const loadIgnorePatterns = require( 'jetpack-js-tools/load-eslint-ignore.js' );
// module.exports = {
// 	root: true,
// 	extends: [ require.resolve( 'jetpack-js-tools/eslintrc/base' ) ],
// 	ignorePatterns: loadIgnorePatterns( __dirname ),
// };
// ```

const { defaultConditionNames } = require( 'eslint-import-resolver-typescript' );

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
	},
	settings: {
		'import/resolver': {
			typescript: {
				project: 'projects/*/*/tsconfig.json',
				conditionNames: process.env.npm_config_jetpack_webpack_config_resolve_conditions
					? process.env.npm_config_jetpack_webpack_config_resolve_conditions
							.split( ',' )
							.concat( defaultConditionNames )
					: defaultConditionNames,
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
	plugins: [ 'import', 'prettier', 'jsx-a11y', 'lodash', 'jsdoc', 'n' ],
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

		eqeqeq: [
			'error',
			'always',
			{
				// `== null` is a convenient shorthand for exactly `=== null || === undefined`.
				null: 'ignore',
			},
		],

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
		// Redundant roles are sometimes necessary for screen reader support. For instance, VoiceOver
		// on Safari requires `role=list` to announce the list if the style is overwritten.
		'jsx-a11y/no-redundant-roles': 'off',

		'lodash/import-scope': [ 'error', 'member' ],

		'n/no-deprecated-api': 'error',
		'n/no-exports-assign': 'error',
		'n/no-process-exit': 'error',
		'n/process-exit-as-throw': 'error',
		'n/no-restricted-import': [ 'error', restrictedPaths ],
		'n/no-restricted-require': [ 'error', restrictedPaths ],

		'new-cap': [ 'error', { capIsNew: false, newIsCap: true } ],
		'no-new': 'error',
		'object-shorthand': 'off',
		'prefer-const': [ 'error', { destructuring: 'any' } ],
		strict: [ 'error', 'never' ],

		// @typescript-eslint/no-unused-expressions works better. Use it always.
		'no-unused-expressions': 'off',
		'@typescript-eslint/no-unused-expressions': [
			'error',
			{
				// `cond && func()` and `cond ? func1() : func2()` are too useful to forbid.
				allowShortCircuit: true,
				allowTernary: true,
			},
		],
	},
};
