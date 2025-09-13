const baseConfig = require( 'jetpack-js-tools/jest/config.base.js' );

module.exports = {
	...baseConfig,
	roots: [ '<rootDir>/tests' ], // Only our tests directory
	testEnvironmentOptions: {
		...baseConfig.testEnvironmentOptions,
		url: 'https://example.com',
	},
	// Override testMatch to look in our tests directory
	testMatch: [ '<rootDir>/tests/**/?(*.)+(spec|test).[jt]s?(x)' ],
	// Keep other settings from base config
	transform: {
		...baseConfig.transform,
		'\\.[jt]sx?$': require( 'jetpack-js-tools/jest/babel-jest-config-factory.js' )(
			require.resolve
		),
	},
	moduleNameMapper: {
		...baseConfig.moduleNameMapper,
		'tiny-lru/lib/tiny-lru.esm$': '<rootDir>/src/instant-search/lib/test-helpers/tiny-lru.mock.js',
		'instant-search/components/gridicon':
			'<rootDir>/src/instant-search/components/gridicon/index.jsx',
	},
	moduleDirectories: [ 'node_modules', '<rootDir>/src/dashboard' ],
	setupFilesAfterEnv: [ ...baseConfig.setupFilesAfterEnv, '<rootDir>/tests/jest-globals.gui.js' ],
};
