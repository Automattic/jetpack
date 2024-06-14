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
		'plugin:wpcalypso/recommended',
		'plugin:@wordpress/eslint-plugin/i18n',
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
				// Override wpcalypso, we'd rather follow jsdoc and typescript in this.
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
	plugins: [ 'import', 'prettier', 'jsx-a11y', 'lodash', 'jsdoc', '@typescript-eslint' ],
	rules: {
		// REST API objects include underscores
		camelcase: 0,
		'comma-spacing': 2,
		curly: 2,
		'computed-property-spacing': [ 2, 'always' ],
		'func-call-spacing': 2,
		'import/order': [
			2,
			{
				'newlines-between': 'never',
				alphabetize: { order: 'asc' },
				groups: [ 'builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type' ],
			},
		],
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
		'no-restricted-imports': [
			2,
			{
				paths: restrictedPaths,
			},
		],
		'no-restricted-modules': [
			2,
			{
				paths: restrictedPaths,
			},
		],
		'no-shadow': 2,
		'no-spaced-func': 2,
		'no-trailing-spaces': 2,
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
		'wpcalypso/i18n-no-this-translate': 2,
		'wpcalypso/i18n-mismatched-placeholders': 2,
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
		// Redundant roles are sometimes necessary for screen reader support. For instance, VoiceOver
		// on Safari requires `role=list` to announce the list if the style is overwritten.
		'jsx-a11y/no-redundant-roles': 0,
		// Disabled rules for now. Ideally we should resolve all the errors these rules create.
		'wpcalypso/redux-no-bound-selectors': 0,
		'jsx-a11y/anchor-has-content': 0,
		'react/no-string-refs': 0,
		'jsx-a11y/anchor-is-valid': 0,

		// Both wpcalypso and @wordpress/eslint-plugin offer these. We only need one copy.
		'wpcalypso/i18n-ellipsis': 0,
		'wpcalypso/i18n-no-collapsible-whitespace': 0,
		'wpcalypso/i18n-no-variables': 0,

		// Rules that only make sense for Calypso.
		'wpcalypso/i18n-unlocalized-url': 0,

		// Dummy domain, projects should override this in their own .eslintrc.js.
		'@wordpress/i18n-text-domain': [
			'error',
			{
				allowedTextDomain: "no text domain is set in this in this project's .eslintrc.js",
			},
		],

		// JSDoc plugin overrides
		'jsdoc/check-alignment': 1, // Recommended
		'jsdoc/check-examples': 0, // See https://github.com/eslint/eslint/issues/14745
		'jsdoc/check-indentation': 1,
		'jsdoc/check-param-names': 1, // Recommended
		'jsdoc/check-syntax': 1,
		'jsdoc/check-tag-names': [
			1, // Recommended
			{ definedTags: [ 'jest-environment' ] },
		],
		'jsdoc/check-types': [
			'error',
			{
				// See above, wpcalypso also sets this true for their "Object" preference.
				unifyParentAndChildTypeChecks: false,
			},
		],
		'jsdoc/implements-on-classes': 1, // Recommended
		'jsdoc/no-defaults': 0,
		'jsdoc/no-undefined-types': [
			1,
			{
				definedTypes: [
					'Iterable', // https://github.com/jsdoc/jsdoc/issues/1009 and https://github.com/gajus/eslint-plugin-jsdoc/issues/280
				],
			},
		],
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
		'jsdoc/tag-lines': [
			'warn',
			'any',
			{
				startLines: null,
				endLines: 0,
				applyToEndTag: false,
			},
		],
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
		// Misc
		'no-use-before-define': 'off',
	},
};
