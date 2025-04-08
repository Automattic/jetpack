const baseConfig = require( 'jetpack-js-tools/jest/config.base.js' );

module.exports = {
	...baseConfig,
	collectCoverageFrom: [
		'<rootDir>/components/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}',
		'<rootDir>/lib/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}',
		'<rootDir>/tools/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}',
		...baseConfig.collectCoverageFrom,
	],
};
