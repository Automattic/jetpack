module.exports = {
	// Use root level ESlint configuration.
	// JavaScript files inside this folder are meant to be transpiled by Webpack.
	root: true,
	extends: [ '../../.eslintrc.js' ],
	env: {
		browser: false,
	},
	rules: {
		'no-console': 'off',
		'no-process-exit': 'off',
	},
};
