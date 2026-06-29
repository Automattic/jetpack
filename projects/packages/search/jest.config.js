const baseConfig = require( 'jetpack-js-tools/jest/config.base.js' );

module.exports = {
	...baseConfig,
	roots: [ '<rootDir>/src', '<rootDir>/tests/js' ],

	// Pin jsdom's window URL so tests that inspect `window.location.protocol`
	// or `hostname` (e.g. use-photon's protocol-detection tests) see a
	// realistic https origin instead of the default `http://localhost/`.
	testEnvironmentOptions: {
		...baseConfig.testEnvironmentOptions,
		url: 'https://example.com',
	},

	transform: {
		...baseConfig.transform,
		'\\.[jt]sx?$': require( 'jetpack-js-tools/jest/babel-jest-config-factory.js' )(
			require.resolve
		),
	},
	moduleNameMapper: {
		...baseConfig.moduleNameMapper,
		// The blocks build externalizes this bare specifier to the
		// `jetpack-search/store` Script Module; Jest has no such resolver,
		// so point it at the real store source.
		'^jetpack-search/store$': '<rootDir>/src/search-blocks/store/index.js',
		'tiny-lru/lib/tiny-lru.esm$': '<rootDir>/src/instant-search/lib/test-helpers/tiny-lru.mock.js',
		'instant-search/components/gridicon':
			'<rootDir>/src/instant-search/components/gridicon/index.jsx',
	},
	moduleDirectories: [ 'node_modules', '<rootDir>/src/dashboard' ],
	setupFilesAfterEnv: [ ...baseConfig.setupFilesAfterEnv, '<rootDir>/tests/jest-globals.gui.js' ],
};
