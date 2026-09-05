const baseConfig = require( 'jetpack-js-tools/jest/config.base.js' );

module.exports = {
	...baseConfig,
	setupFilesAfterEnv: [ ...baseConfig.setupFilesAfterEnv, '<rootDir>/jest.setup.js' ],
	roots: [ '<rootDir>/src' ],
	transform: {
		...baseConfig.transform,
		'\\.m?[jt]sx?$': require( 'jetpack-js-tools/jest/babel-jest-config-factory.js' )(
			require.resolve
		),
	},
};
