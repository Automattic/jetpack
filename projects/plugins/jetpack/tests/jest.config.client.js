const baseConfig = require( './jest.config.base.js' );

module.exports = {
	...baseConfig,
	roots: [ '<rootDir>/_inc/client/state/', '<rootDir>/_inc/client/lib/', '<rootDir>/modules/' ],
	setupFilesAfterEnv: [ ...baseConfig.setupFilesAfterEnv, '<rootDir>/tests/jest-globals.gui.js' ],
	coverageDirectory: baseConfig.coverageDirectory + '/client',
	collectCoverageFrom: [
		'<rootDir>/_inc/client/state/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}',
		'<rootDir>/_inc/client/lib/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}',
		'<rootDir>/modules/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}',
		...baseConfig.collectCoverageFrom.slice( 3 ),
	],
};
