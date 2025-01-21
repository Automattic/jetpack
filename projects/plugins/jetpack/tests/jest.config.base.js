const path = require( 'path' );
const baseConfig = require( '@automattic/jetpack-js-tools/jest/config.base.js' );

module.exports = {
	...baseConfig,
	rootDir: path.resolve( __dirname, '..' ),
	transform: {
		...baseConfig.transform,
		'\\.[jt]sx?$': require( '@automattic/jetpack-js-tools/jest/babel-jest-config-factory.js' )(
			require.resolve
		),
	},
};
