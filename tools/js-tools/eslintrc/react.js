/**
 * @type {import("eslint").Linter.Config}
 */
module.exports = {
	extends: [
		'./preload.js',
		'plugin:@wordpress/react',
		// Some configs currently don't load this otherwise. Sigh.
		'./base.js',
	],
	settings: {
		react: {
			version: 'detect', // React version. "detect" automatically picks the version you have installed.
		},
	},
	rules: {
		'react/jsx-no-bind': [ 'error', { ignoreRefs: true } ],
		'react/no-danger': 'error',
		'react/no-did-mount-set-state': 'error',
		'react/no-did-update-set-state': 'error',
		'react/prefer-es6-class': 'warn',
	},
};
