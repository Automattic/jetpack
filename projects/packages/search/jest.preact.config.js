const baseConfig = require( 'jetpack-js-tools/jest/config.base.js' );

// Mirrors tools/webpack.instant.config.js: the Instant Search bundle aliases React to
// preact/compat, so react-redux runs against Preact's hooks in production. The main Jest
// config runs real React, which cannot catch a regression on that path.
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
	// Several of preact's entry points publish ESM, so let Babel transform it — the same
	// allowlist shape the base config uses for `marked/` and `uuid/`.
	transformIgnorePatterns: [ '/node_modules/(?!.*/node_modules/)(?!preact/)' ],
	moduleNameMapper: {
		...baseConfig.moduleNameMapper,
		// webpack's `react` alias covers subpaths; Jest's mapper does not, so the JSX
		// runtime has to be redirected explicitly or JSX compiles against real React.
		// Absolute paths: pnpm's isolated node_modules means a bare 'preact/compat'
		// will not resolve from inside react-redux's own tree.
		'^react/jsx-runtime$': require.resolve( 'preact/compat/jsx-runtime' ),
		'^react/jsx-dev-runtime$': require.resolve( 'preact/compat/jsx-dev-runtime' ),
		'^react-dom/test-utils$': require.resolve( 'preact/test-utils' ),
		'^react-dom$': require.resolve( 'preact/compat' ),
		'^react$': require.resolve( 'preact/compat' ),
	},
};
