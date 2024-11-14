import coverageConfig from 'jetpack-js-tools/jest/config.coverage.js';

export default {
	...coverageConfig,
	rootDir: '../',
	testEnvironment: 'jest-environment-node',
	testMatch: [ '**/?(*.)+(spec|test).js' ],
	setupFilesAfterEnv: [ './config/jest-setup.js' ],
	testPathIgnorePatterns: [ '/node_modules/', 'config/jest-setup.js', 'build-node/*' ],
	moduleDirectories: [ 'build-node', 'node_modules' ],
};
