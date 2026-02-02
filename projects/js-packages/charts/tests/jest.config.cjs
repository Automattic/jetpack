const path = require( 'path' );
const baseConfig = require( 'jetpack-js-tools/jest/config.base.js' );

module.exports = {
	...baseConfig,
	rootDir: path.join( __dirname, '..' ),
	transform: {
		...baseConfig.transform,
		'\\.[jt]sx?$': require( 'jetpack-js-tools/jest/babel-jest-config-factory.js' )(
			require.resolve
		),
	},
	// Transform d3-* ESM packages (pattern accounts for pnpm .pnpm directory structure)
	transformIgnorePatterns: [ '/node_modules/(?!(\\.pnpm/(d3-|internmap)|d3-|internmap))' ],
	moduleNameMapper: {
		...baseConfig.moduleNameMapper,
		// Mock @wordpress/theme CSS import
		'@wordpress/theme/design-tokens\\.css$': '<rootDir>/tests/__mocks__/styleMock.js',
	},
};
