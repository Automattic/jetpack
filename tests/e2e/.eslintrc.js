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
		'arrow-parens': [ 'as-needed' ],
	},
};
