module.exports = {
	// Use root level ESlint configuration.
	// JavaScript files inside this folder are meant to be transpiled by Webpack.
	root: true,
	extends: [ '../../.eslintrc.js', 'plugin:@wordpress/eslint-plugin/i18n' ],
	rules: {
		// Enforce the use of the Jetpack textdomain.
		'@wordpress/i18n-text-domain': [
			'error',
			{
				allowedTextDomain: 'jetpack',
			},
		],
	},
};
