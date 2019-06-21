// .eslintrc.js
module.exports = {
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
	},
	rules: {
		'arrow-parens': [ 0, 'as-needed' ],
		'wpcalypso/import-docblock': 0,
		'no-console': 0,
	},
};
