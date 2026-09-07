const path = require( 'path' );
const baseConfig = require( 'jetpack-js-tools/jest/config.base.js' );

module.exports = {
	...baseConfig,
	rootDir: path.resolve( __dirname, '..' ),
	transform: {
		...baseConfig.transform,
		'\\.m?[jt]sx?$': require( 'jetpack-js-tools/jest/babel-jest-config-factory.js' )(
			require.resolve
		),
	},
};
