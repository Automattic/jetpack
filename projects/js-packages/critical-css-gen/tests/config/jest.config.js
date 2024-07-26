export default {
	rootDir: '../',
	testEnvironment: 'jest-environment-node',
	testMatch: [ '**/?(*.)+(spec|test).js' ],
	setupFilesAfterEnv: [ './config/jest-setup.js' ],
	collectCoverageFrom: [ '../lib/*.js' ],
	testPathIgnorePatterns: [ '/node_modules/', 'config/jest-setup.js', 'lib/*' ],
	moduleDirectories: [ 'lib', 'node_modules' ],
};
