const baseConfig = require( 'jetpack-js-tools/jest/config.base.js' );

module.exports = {
	...baseConfig,
	roots: [ '<rootDir>/_inc' ],
	setupFiles: [ ...baseConfig.setupFiles, '<rootDir>/jest-globals.js' ],
	transform: {
		...baseConfig.transform,
		'\\.m?[jt]sx?$': require( 'jetpack-js-tools/jest/babel-jest-config-factory.js' )(
			require.resolve
		),
	},
	collectCoverageFrom: [
		'<rootDir>/_inc/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}',
		...baseConfig.collectCoverageFrom,
	],
};
