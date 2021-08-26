module.exports = {
	root: true,
	extends: [ 'plugin:@wordpress/eslint-plugin/recommended' ],
	globals: {
		wp: 'off',
	},
	parserOptions: {
		babelOptions: {
			configFile: require.resolve( './babel.config.js' ),
		},
	},
	rules: {
		// Enforce the use of the jetpack textdomain.
		'@wordpress/i18n-text-domain': [
			'error',
			{
				allowedTextDomain: 'jetpack',
			},
		],
	},
};
