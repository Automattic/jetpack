module.exports = {
	// This project uses react, so load the shared react config.
	root: true,
	extends: [ '../../../.eslintrc.react.js' ],
	parserOptions: {
		babelOptions: {
			configFile: require.resolve( './babel.config.js' ),
		},
	},
	rules: {
		// Enforce the use of the jetpack-backup textdomain.
		'@wordpress/i18n-text-domain': [
			'error',
			{
				allowedTextDomain: 'jetpack-backup',
			},
		],
	},
};
