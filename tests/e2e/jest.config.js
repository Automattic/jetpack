/**
 * For a detailed explanation of configuration properties, visit:
 * https://jestjs.io/docs/en/configuration.html
 */

module.exports = {
	preset: 'jest-puppeteer',
	setupFiles: [ '<rootDir>/config/config.js' ],
	setupFilesAfterEnv: [ '<rootDir>/config/setup.js', 'expect-puppeteer' ],
};
