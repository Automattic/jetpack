/**
 * For a detailed explanation of configuration properties, visit:
 * https://jestjs.io/docs/en/configuration.html
 */

module.exports = {
	preset: 'jest-puppeteer',
	globalTeardown: './lib/global-teardown.js',
	setupFilesAfterEnv: [
		'jest-allure/dist/setup',
		'<rootDir>/lib/setup-env.js',
		'expect-puppeteer',
	],
};
