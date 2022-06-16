const path = require( 'path' );
const baseConfig = require( 'jetpack-js-tools/jest/config.base.js' );

module.exports = {
	...baseConfig,
	transform: {
		...baseConfig.transform,
		'\\.[jt]sx?$': require( 'jetpack-js-tools/jest/babel-jest-config-factory.js' )(
			require.resolve
		),
	},
	setupFilesAfterEnv: [
		...baseConfig.setupFilesAfterEnv,
		path.join( __dirname, 'tests/jest-enzyme-init.js' ),
		require.resolve( 'jest-enzyme' ),
	],
};
