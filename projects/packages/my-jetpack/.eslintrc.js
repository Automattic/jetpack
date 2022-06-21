module.exports = {
	extends: [ require.resolve( 'jetpack-js-tools/eslintrc/react' ) ],
	parserOptions: {
		babelOptions: {
			configFile: require.resolve( './babel.config.js' ),
		},
	},
	rules: {
		// Enforce use of the correct textdomain.
		'@wordpress/i18n-text-domain': [
			'error',
			{
				allowedTextDomain: 'jetpack-my-jetpack',
			},
		],
	},
	overrides: [
		{
			files: [ '**/test/*.[jt]s?(x)', '**/*.test.[jt]s?(x)' ],
			extends: [ require.resolve( 'jetpack-js-tools/eslintrc/jest' ) ],
		},
	],
};
