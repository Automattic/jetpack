const loadIgnorePatterns = require( 'jetpack-js-tools/load-eslint-ignore.js' );

module.exports = {
	root: true,
	extends: [ require.resolve( 'jetpack-js-tools/eslintrc/base' ) ],
	ignorePatterns: loadIgnorePatterns( __dirname ),
	parserOptions: {
		tsconfigRootDir: __dirname,
		project: [ './tsconfig.json' ],
	},
	overrides: [
		{
			files: [ '*.js', '*.cjs' ],
			parserOptions: {
				project: null,
			},
		},
	],
	rules: {
		'@wordpress/i18n-text-domain': [
			'error',
			{
				allowedTextDomain: 'boost-score-api',
			},
		],
	},
};
