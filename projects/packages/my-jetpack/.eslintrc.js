const loadIgnorePatterns = require( '../../../tools/js-tools/load-eslint-ignore.js' );

module.exports = {
	// This project uses react, so load the shared react config.
	root: true,
	extends: [ '../../../.eslintrc.react.js' ],
	ignorePatterns: loadIgnorePatterns( __dirname ),
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
