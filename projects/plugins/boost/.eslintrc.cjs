// eslint-disable-next-line import/no-extraneous-dependencies
const loadIgnorePatterns = require( 'jetpack-js-tools/load-eslint-ignore.js' );

module.exports = {
	root: true,
	extends: [
		require.resolve( 'jetpack-js-tools/eslintrc/base' ),
		require.resolve( 'jetpack-js-tools/eslintrc/wp-eslint-plugin/recommended' ),
		require.resolve( 'jetpack-js-tools/eslintrc/svelte' ),
	],
	ignorePatterns: [ '**/stories/*.stories.tsx', ...loadIgnorePatterns( __dirname ) ],
	parserOptions: {
		babelOptions: {
			configFile: require.resolve( './babel.config.js' ),
		},
		sourceType: 'module',
		tsconfigRootDir: __dirname,
		project: [ './tsconfig.json' ],
	},
	overrides: [
		// .js and .cjs files in the root are not part of the TypeScript project.
		{
			files: [ '*.js', '*.cjs' ],
			parserOptions: {
				project: null,
			},
		},
	],
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

		'jsdoc/no-undefined-types': [
			1,
			{
				definedTypes: [ 'TemplateVars', 'ErrorSet', 'Readable' ],
			},
		],

		// This is not a react project.
		'react-hooks/rules-of-hooks': 0,

		'no-nested-ternary': 0,
		'prettier/prettier': 0,
		camelcase: 0,
	},
};
