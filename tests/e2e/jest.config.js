/**
 * For a detailed explanation of configuration properties, visit:
 * https://jestjs.io/docs/en/configuration.html
 */

module.exports = {
	preset: 'jest-puppeteer',
	setupFiles: [ '<rootDir>/lib/setup.js' ],
	setupFilesAfterEnv: [ '<rootDir>/lib/setup-env.js', 'expect-puppeteer' ],
};
