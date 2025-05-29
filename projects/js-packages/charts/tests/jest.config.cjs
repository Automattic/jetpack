const path = require( 'path' );
const baseConfig = require( 'jetpack-js-tools/jest/config.base.js' );

module.exports = {
	...baseConfig,
	rootDir: path.join( __dirname, '..' ),
	testEnvironment: 'jsdom',
	setupFilesAfterEnv: [
		...baseConfig.setupFilesAfterEnv,
		'@testing-library/jest-dom',
		'<rootDir>/tests/jest.setup.js',
	],
	// d3-format is not transpiled to CommonJS, so we need to transform it.
	transformIgnorePatterns: [ 'node_modules/(?!(?:\\.pnpm|d3-format)/)' ],
	transform: {
		...baseConfig.transform,
		'\\.[jt]sx?$': require( 'jetpack-js-tools/jest/babel-jest-config-factory.js' )(
			require.resolve
		),
	},
};
