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
	parserOptions: {
		requireConfigFile: true,
	},
	settings: {
		react: {
			version: 'detect', // React version. "detect" automatically picks the version you have installed.
		},
	},
	rules: {
		'react/jsx-curly-spacing': [ 'error', 'always' ],
		'react/jsx-no-bind': [ 'error', { ignoreRefs: true } ],
		'react/jsx-tag-spacing': [ 'error', { beforeSelfClosing: 'always' } ],
		'react/no-danger': 'error',
		'react/no-did-mount-set-state': 'error',
		'react/no-did-update-set-state': 'error',
		'react/prefer-es6-class': 'warn',

		// Temporarily override plugin:@wordpress/react so we can clean up failing stuff in separate PRs.
		'react-hooks/exhaustive-deps': [ 'warn', { additionalHooks: '' } ],
		'react/jsx-key': 'off',
		'react/no-direct-mutation-state': 'off',
		'react/no-find-dom-node': 'off',
		'react/no-unescaped-entities': 'off',
		'react/no-unknown-property': 'off',
	},
};
