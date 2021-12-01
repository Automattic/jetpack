// .eslintrc.js
module.exports = {
	root: true,
	extends: [ 'plugin:@wordpress/eslint-plugin/recommended', 'plugin:playwright/playwright-test' ],
	parserOptions: {
		requireConfigFile: false,
	},
	globals: {
		wp: true,
		jpConnect: true,
	},
	rules: {
		'arrow-parens': [ 0, 'as-needed' ],
		'no-console': 0,
		'jest/no-done-callback': 0,
		'jest/no-disabled-tests': 0,
	},
};
