const baseConfig = require( 'jetpack-js-tools/jest/config.base.js' );

module.exports = {
	...baseConfig,
	setupFiles: [ ...baseConfig.setupFiles, '<rootDir>/jest-globals.js' ],
	transform: {
		...baseConfig.transform,
		'\\.[jt]sx?$': require( 'jetpack-js-tools/jest/babel-jest-config-factory.js' )(
			require.resolve
		),
	},
	collectCoverageFrom: [
		'<rootDir>/components/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}',
		'<rootDir>/hooks/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}',
		...baseConfig.collectCoverageFrom,
	],
};
