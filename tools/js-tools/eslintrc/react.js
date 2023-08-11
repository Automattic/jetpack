/**
 * @type {import("eslint").Linter.Config}
 */
module.exports = {
	extends: [
		'./preload.js',
		'plugin:wpcalypso/react',
		// Re-extend our base to re-override wpcalypso.
		'./base.js',
	],
	parserOptions: {
		requireConfigFile: true,
	},
	settings: {
		react: {
			version: 'detect', // React version. "detect" automatically picks the version you have installed.
		},
	},
	rules: {
		'react/jsx-curly-spacing': [ 2, 'always' ],
		'react/jsx-no-bind': 2,
		// 'react/jsx-space-before-closing': 2,
		'react/jsx-tag-spacing': [ 2, { beforeSelfClosing: 'always' } ],
		'react/no-danger': 2,
		'react/no-did-mount-set-state': 2,
		'react/no-did-update-set-state': 2,
		'react/no-is-mounted': 2,
		'react/prefer-es6-class': 1,
		'react/no-string-refs': 0,
		// suppress errors for missing 'import React' in files
		'react/react-in-jsx-scope': 'off',
	},
};
