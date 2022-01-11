module.exports = {
	// This project uses react, so load the shared react config.
	root: true,
	extends: [ 'plugin:@wordpress/eslint-plugin/recommended' ],
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
};
