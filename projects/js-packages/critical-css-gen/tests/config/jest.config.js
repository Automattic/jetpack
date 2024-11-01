export default {
	rootDir: '../',
	testEnvironment: 'jest-environment-node',
	testMatch: [ '**/?(*.)+(spec|test).js' ],
	setupFilesAfterEnv: [ './config/jest-setup.js' ],
	collectCoverageFrom: [ '../src/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}' ],
	testPathIgnorePatterns: [ '/node_modules/', 'config/jest-setup.js', 'build-node/*' ],
	moduleDirectories: [ 'build-node', 'node_modules' ],
};
