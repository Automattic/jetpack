const loadIgnorePatterns = require( '../../../tools/js-tools/load-eslint-ignore.js' );

module.exports = {
	// This project uses react, so load the shared react config.
	root: true,
	extends: [ '../../../.eslintrc.react.js' ],
	ignorePatterns: loadIgnorePatterns( __dirname ),
	parserOptions: {
		requireConfigFile: false,
		babelOptions: {
			presets: [ '@babel/preset-react' ],
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
};
