const baseConfig = require( 'jetpack-js-tools/jest/config.base.js' );

module.exports = {
	...baseConfig,
	roots: [ '<rootDir>/src' ],
	setupFiles: [ ...baseConfig.setupFiles, '<rootDir>/jest-globals.js' ],
	transform: {
		...baseConfig.transform,
		'\\.[jt]sx?$': require( 'jetpack-js-tools/jest/babel-jest-config-factory.js' )(
			require.resolve
		),
	},
	moduleNameMapper: {
		...baseConfig.moduleNameMapper,
		// Map @automattic/ui CSS imports to stub to prevent Jest parsing errors
		'@automattic/ui/style\\.css$': require.resolve(
			'jetpack-js-tools/jest/jest-extensions-asset-stub.js'
		),
	},
};
