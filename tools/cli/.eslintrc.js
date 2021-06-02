// .eslintrc.js
module.exports = {
	root: true,
	extends: [ 'plugin:@wordpress/eslint-plugin/recommended' ],
	env: {
		browser: false,
	},
	rules: {
		'arrow-parens': [ 0, 'as-needed' ],
		'no-console': 0,
		'no-process-exit': 'off',
	},
};
