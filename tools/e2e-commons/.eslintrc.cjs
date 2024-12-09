// .eslintrc.js
module.exports = {
	extends: [ require.resolve( 'jetpack-js-tools/eslintrc/playwright' ) ],
	env: {
		node: true,
	},
	globals: {
		wp: true,
		jpConnect: true,
	},
	rules: {
		'no-console': 0,
		'n/no-process-exit': 0,
		'playwright/no-skipped-test': 0,
		// False positives when using `page.getByRole()`
		'testing-library/prefer-screen-queries': 0,
	},
};
