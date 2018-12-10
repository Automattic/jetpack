/** @format */

const reactVersion = require( './package.json' ).dependencies.react;

module.exports = {
	root: true,
	extends: [
		'wpcalypso/react',
		'plugin:jsx-a11y/recommended',
		// 'prettier',
		// 'prettier/react',
	],
	parser: 'babel-eslint',
	env: {
		browser: true,
		mocha: true,
		node: true,
		jquery: true
	},
	plugins: [ 'jsx-a11y', 'lodash' ],
	settings: {
		react: {
			version: reactVersion,
		},
	},
	rules: {
		// REST API objects include underscores
		camelcase: 0,

		// TODO: shorten all long lines
		'max-len': 0,

		// i18n-calypso translate triggers false failures
		'jsx-a11y/anchor-has-content': 0,

		'wpcalypso/jsx-classname-namespace': 0,
		// enforce our classname namespacing rules
		// 'wpcalypso/jsx-classname-namespace': [
		// 	2,
		// 	{
		// 		rootFiles: [ 'index.js', 'index.jsx', 'main.js', 'main.jsx' ],
		// 	},
		// ],

		// Force folks to use our custom combineReducers function instead of the plain redux one
		// This allows us to control serialization for every reducer.
		'wpcalypso/import-no-redux-combine-reducers': 2,

		// No applicable in Jetpack
		'wpcalypso/import-no-redux-combine-reducers': 0,

		// TODO: migrate to ES6 Classes
		'react/prefer-es6-class': 0,

		'jsx-a11y/no-static-element-interactions': 0,
	},
};
