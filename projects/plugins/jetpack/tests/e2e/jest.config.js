/**
 * For a detailed explanation of configuration properties, visit:
 * https://jestjs.io/docs/en/configuration.html
 */

process.env.JEST_PLAYWRIGHT_CONFIG = 'jest-playwright.config.js';

module.exports = {
	preset: 'jest-playwright-preset',
	testEnvironment: '<rootDir>/lib/env/playwright-environment.js',
	globalSetup: '<rootDir>/lib/env/global-setup.js',
	globalTeardown: '<rootDir>/lib/env/global-teardown.js',
	setupFilesAfterEnv: [ '<rootDir>/lib/env/test-setup.js', 'expect-playwright' ],
	testRunner: 'jest-circus/runner',
};
