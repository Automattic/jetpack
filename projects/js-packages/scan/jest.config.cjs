const path = require( 'path' );
const baseConfig = require( 'jetpack-js-tools/jest/config.base.js' );

// Find the dataviews build path
const dataviewsPath = path.dirname( require.resolve( '@wordpress/dataviews/package.json' ) );

module.exports = {
	...baseConfig,
	testEnvironmentOptions: {
		...baseConfig.testEnvironmentOptions,
		customExportConditions: [
			'jetpack:src',
			...( baseConfig.testEnvironmentOptions?.customExportConditions || [] ),
		],
	},
	moduleNameMapper: {
		...baseConfig.moduleNameMapper,
		'^@wordpress/dataviews$': path.join( dataviewsPath, 'build', 'index.js' ),
	},
	testPathIgnorePatterns: [ ...baseConfig.testPathIgnorePatterns, '<rootDir>/build/' ],
};
