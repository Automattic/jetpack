const baseConfig = require( 'jetpack-js-tools/jest/config.base.js' );

// Aliases React to preact/compat as tools/webpack.instant.config.js does, so react-redux
// runs against Preact's hooks the way it does in the Instant Search bundle.
module.exports = {
	...baseConfig,
	roots: [ '<rootDir>/tests/preact' ],
	testMatch: [ '<rootDir>/tests/preact/**/?(*.)+(spec|test).[jt]s?(x)' ],
	testEnvironmentOptions: {
		...baseConfig.testEnvironmentOptions,
		url: 'https://example.com',
	},
	transform: {
		...baseConfig.transform,
		'\\.m?[jt]sx?$': require( 'jetpack-js-tools/jest/babel-jest-config-factory.js' )(
			require.resolve
		),
	},
	// Several of preact's entry points publish ESM. This replaces the base config's allowlist,
	// so add any other ESM package a test here needs.
	transformIgnorePatterns: [ '/node_modules/(?!.*/node_modules/)(?!preact/)' ],
	moduleNameMapper: {
		...baseConfig.moduleNameMapper,
		// Jest compiles JSX with the automatic runtime (the bundle uses classic), so
		// `react/jsx-runtime` must be redirected too or it resolves to real React.
		// Absolute paths: pnpm's isolated node_modules means a bare 'preact/compat'
		// will not resolve from inside react-redux's own tree.
		'^react/jsx-runtime$': require.resolve( 'preact/compat/jsx-runtime' ),
		'^react/jsx-dev-runtime$': require.resolve( 'preact/compat/jsx-dev-runtime' ),
		'^react-dom/test-utils$': require.resolve( 'preact/test-utils' ),
		'^react-dom$': require.resolve( 'preact/compat' ),
		'^react$': require.resolve( 'preact/compat' ),
	},
};
