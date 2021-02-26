/**
 * For a detailed explanation of configuration properties, visit:
 * https://jestjs.io/docs/en/configuration.html
 */

process.env.JEST_PLAYWRIGHT_CONFIG = 'jest-playwright.config.js';

module.exports = {
	preset: 'jest-playwright-preset',
	globalTeardown: './lib/global-teardown.js',
	setupFilesAfterEnv: [
		'jest-allure/dist/setup',
		'<rootDir>/lib/setup-env.js',
		'expect-playwright',
	],
	testRunner: 'jasmine2',
};
