// .eslintrc.js
module.exports = {
	root: true,
	extends: [ 'plugin:@wordpress/eslint-plugin/recommended', 'plugin:jest/recommended' ],
	env: {
		// jest: true,
		browser: true,
	},
	globals: {
		browser: true,
		page: true,
		wp: true,
		context: true,
		jestPuppeteer: true,
		reporter: true,
	},
	rules: {
		'arrow-parens': [ 0, 'as-needed' ],
		'wpcalypso/import-docblock': 0,
		'no-console': 0,
		'jest/no-jasmine-globals': 0,
	},
};
