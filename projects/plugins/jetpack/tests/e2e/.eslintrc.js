// .eslintrc.js
module.exports = {
	root: true,
	extends: [
		'plugin:@wordpress/eslint-plugin/recommended',
		'plugin:@wordpress/eslint-plugin/i18n',
		'plugin:jest/recommended',
	],
	env: {
		// jest: true,
		browser: true,
	},
	globals: {
		browser: true,
		page: true,
		wp: true,
		context: true,
		reporter: true,
		jpConnect: true,
		siteUrl: true,
	},
	settings: {
		jest: {
			version: 26,
		},
	},
	rules: {
		'arrow-parens': [ 0, 'as-needed' ],
		'wpcalypso/import-docblock': 0,
		'no-console': 0,
		'jest/no-jasmine-globals': 0,
	},
};
