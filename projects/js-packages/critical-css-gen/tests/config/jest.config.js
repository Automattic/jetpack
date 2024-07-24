export default {
	rootDir: '../',
	testEnvironment: 'jest-environment-node',
	testMatch: [ '**/?(*.)+(spec|test).js' ],
	setupFilesAfterEnv: [ './config/jest-setup.js' ],
	collectCoverageFrom: [ '../lib/*.js' ],
	globalSetup: 'jest-environment-puppeteer/setup',
	globalTeardown: 'jest-environment-puppeteer/teardown',
	testPathIgnorePatterns: [ '/node_modules/', 'config/jest-setup.js', 'lib/*' ],
	moduleDirectories: [ 'lib', 'node_modules' ],
};
