const path = require( 'path' );
const baseConfig = require( '@automattic/jetpack-js-tools/jest/config.base.js' );

module.exports = {
	...baseConfig,
	rootDir: path.join( __dirname, '..' ),
	testEnvironment: 'jsdom',
	setupFilesAfterEnv: [
		...baseConfig.setupFilesAfterEnv,
		'@testing-library/jest-dom',
		'<rootDir>/tests/jest.setup.js',
	],
	transform: {
		...baseConfig.transform,
		'\\.[jt]sx?$': require( '@automattic/jetpack-js-tools/jest/babel-jest-config-factory.js' )(
			require.resolve
		),
	},
};
