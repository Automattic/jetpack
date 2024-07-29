export default {
	rootDir: '../',
	testEnvironment: 'jest-environment-node',
	testMatch: [ '**/?(*.)+(spec|test).js' ],
	setupFilesAfterEnv: [ './config/jest-setup.js' ],
	collectCoverageFrom: [ '../build-node/*.js' ],
	testPathIgnorePatterns: [ '/node_modules/', 'config/jest-setup.js', 'build-node/*' ],
	moduleDirectories: [ 'build-node', 'node_modules' ],
};
