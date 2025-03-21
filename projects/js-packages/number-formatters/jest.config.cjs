const baseConfig = require( 'jetpack-js-tools/jest/config.base.js' );

module.exports = {
	...baseConfig,
	collectCoverageFrom: [
		'<rootDir>/src/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}',
		...baseConfig.collectCoverageFrom,
	],
};
