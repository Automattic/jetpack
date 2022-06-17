module.exports = {
	extends: [ require.resolve( 'jetpack-js-tools/eslintrc/react' ) ],
	parserOptions: {
		requireConfigFile: false,
		babelOptions: {
			presets: [ require.resolve( '@babel/preset-react' ) ],
		},
	},
	rules: {
		// Enforce use of the correct textdomain.
		'@wordpress/i18n-text-domain': [
			'error',
			{
				// @todo: Change this to something not "jetpack".
				allowedTextDomain: 'jetpack',
			},
		],
	},
	overrides: [
		{
			files: [ '**/test/*.[jt]s?(x)' ],
			extends: [ require.resolve( 'jetpack-js-tools/eslintrc/jest' ) ],
		},
	],
};
