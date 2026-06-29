module.exports = {
	transform: {
		'\\.[jt]sx?$': [
			require.resolve( 'babel-jest' ),
			{
				presets: [
					[ require.resolve( '@babel/preset-typescript' ), { allowDeclareFields: true } ],
				],
			},
		],
	},
	testMatch: [
		// Note: Keep the patterns here in sync with ./config.coverage.js and tools/js-tools/eslintrc/files.mjs. config.base.js inherits these.
		'<rootDir>/**/__tests__/**/*.[jt]s?(x)',
		'<rootDir>/**/?(*.)+(spec|test).[jt]s?(x)',
		'<rootDir>/**/test/*.[jt]s?(x)',
		'!**/eslint.config.?([mc])[jt]s',
	],
	testPathIgnorePatterns: [ '/node_modules/', '<rootDir>/vendor/', '<rootDir>/jetpack_vendor/' ],
	extensionsToTreatAsEsm: [ '.ts' ],
	resolver: require.resolve( 'jetpack-js-tools/jest/jest-resolver.js' ),

	...require( './config.coverage.js' ),
};
