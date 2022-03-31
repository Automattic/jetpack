const loadIgnorePatterns = require( '../../../tools/js-tools/load-eslint-ignore.js' );

module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	extends: [
		// '@sveltejs',
		'../../../tools/js-tools/eslintrc/base.js',
		'plugin:@typescript-eslint/recommended',
		'plugin:@wordpress/eslint-plugin/recommended',
	],
	ignorePatterns: loadIgnorePatterns( __dirname ),
	parserOptions: {
		babelOptions: {
			configFile: require.resolve( './babel.config.js' ),
		},
		ecmaVersion: 2020,
		sourceType: 'module',
		tsconfigRootDir: __dirname,
		project: [ './tsconfig.json' ],
		extraFileExtensions: [ '.svelte' ],
	},
	overrides: [
		{
			files: [ '*.js', '*.cjs' ],
			parser: '@babel/eslint-parser',
			extends: [ '../../../.eslintrc.js' ],
		},
		{
			files: [ '*.cjs' ],
			rules: {
				'@typescript-eslint/no-var-requires': 0,
			},
		},
		{
			files: [ '*.svelte' ],
			processor: 'svelte3/svelte3',
		},
	],
	settings: {
		'svelte3/typescript': true,
	},
	plugins: [ 'svelte3', '@typescript-eslint' ],
	rules: {
		// Enforce the use of the jetpack-boost textdomain.
		'@wordpress/i18n-text-domain': [
			'error',
			{
				allowedTextDomain: 'jetpack-boost',
			},
		],

		// Apparently, we like dangling commas
		'comma-dangle': 0,

		// This produces false positives with TypeScript types
		'no-duplicate-imports': 0,

		// This rule is not recommended for TypeScript projects. According to
		// the Typescript-eslint FAQ, TypeScript handles this rule itself at
		// compile-time and does a better job than eslint can.
		// Ref: https://github.com/typescript-eslint/typescript-eslint/blob/master/docs/getting-started/linting/FAQ.md#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
		'no-undef': 0,

		// This rule is for React projects; it prevents components which are not
		// yet mounted in the DOM from attaching to the window directly. Not
		// relevant in a svelte project.
		// Ref: https://github.com/WordPress/gutenberg/pull/26810
		'@wordpress/no-global-event-listener': 0,

		'jsdoc/no-undefined-types': [
			1,
			{
				definedTypes: [ 'TemplateVars', 'ErrorSet', 'Readable' ],
			},
		],

		'prettier/prettier': 0,

		'@typescript-eslint/no-unused-vars': [ 'warn', { argsIgnorePattern: '^_' } ],
	},
};
