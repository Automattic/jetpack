const path = require( 'path' );
const baseConfig = require( 'jetpack-js-tools/jest/config.base.js' );
const { transformIgnorePattern } = require( 'jetpack-js-tools/jest/transform-ignore.js' );

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
	// d3-* and internmap are esm-only.
	transformIgnorePatterns: [ transformIgnorePattern( [ 'd3-', 'internmap/' ] ) ],
	setupFilesAfterEnv: [
		...( baseConfig.setupFilesAfterEnv || [] ),
		path.join( __dirname, 'setup-element-size-mock.js' ),
		path.join( __dirname, 'setup-text-measurement.js' ),
	],
};
