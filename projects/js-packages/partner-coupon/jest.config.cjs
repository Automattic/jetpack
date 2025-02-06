const baseConfig = require( 'jetpack-js-tools/jest/config.base.js' );

module.exports = {
	...baseConfig,
	setupFilesAfterEnv: [ ...baseConfig.setupFilesAfterEnv, '<rootDir>/jest.setup.js' ],
	collectCoverageFrom: [
		'<rootDir>/components/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}',
		'<rootDir>/hooks.{js,mjs,cjs,jsx,ts,tsx,mts,cts}',
		...baseConfig.collectCoverageFrom,
	],
};
