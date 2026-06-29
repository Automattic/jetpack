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
		'\\.[jt]sx?$': require( 'jetpack-js-tools/jest/babel-jest-config-factory.js' )(
			require.resolve
		),
	},
	// Transform d3-* ESM packages (pattern accounts for pnpm .pnpm directory structure)
	transformIgnorePatterns: [ '/node_modules/(?!\\.pnpm/|d3-|internmap/|uuid/)' ],
	setupFilesAfterEnv: [
		...( baseConfig.setupFilesAfterEnv || [] ),
		path.join( __dirname, 'setup-element-size-mock.js' ),
		path.join( __dirname, 'setup-visx-tooltip-mock.js' ),
	],
};
