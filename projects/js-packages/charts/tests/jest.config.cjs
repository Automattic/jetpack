const path = require( 'path' );
const baseConfig = require( 'jetpack-js-tools/jest/config.base.js' );

module.exports = {
	...baseConfig,
	rootDir: path.join( __dirname, '..' ),
	moduleNameMapper: {
		...baseConfig.moduleNameMapper,
		'\\.module\\.scss$': 'identity-obj-proxy',
	},
	transform: {
		...baseConfig.transform,
		'\\.m?[jt]sx?$': require( 'jetpack-js-tools/jest/babel-jest-config-factory.js' )(
			require.resolve
		),
	},
	// Transform d3-* ESM packages. See config.base.js for the `(?!.*/node_modules/)` anchor.
	transformIgnorePatterns: [
		'/node_modules/(?!.*/node_modules/)(?!d3-|internmap/|uuid/|@wordpress/theme/)',
	],
	setupFilesAfterEnv: [
		...( baseConfig.setupFilesAfterEnv || [] ),
		path.join( __dirname, 'setup-element-size-mock.js' ),
		path.join( __dirname, 'setup-visx-tooltip-mock.js' ),
	],
};
