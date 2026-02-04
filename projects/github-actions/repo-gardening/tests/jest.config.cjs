const path = require( 'path' );
const coverageConfig = require( 'jetpack-js-tools/jest/config.coverage.js' );

module.exports = {
	...coverageConfig,
	rootDir: path.resolve( __dirname, '..' ),
	roots: [ '<rootDir>/src/', '<rootDir>/tests/' ],
	resolver: require.resolve( 'jetpack-js-tools/jest/jest-resolver.js' ),
	transform: {
		'\\.[jt]sx?$': [
			require.resolve( 'babel-jest' ),
			{
				presets: [ require.resolve( '@babel/preset-typescript' ) ],
			},
		],
	},
	extensionsToTreatAsEsm: [ '.ts' ],
	moduleNameMapper: {
		'^(\\.{1,2}/.*)\\.js$': '$1',
	},
	clearMocks: true,
	resetModules: true,
};
