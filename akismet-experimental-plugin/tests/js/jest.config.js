const path = require( 'path' );
// Load wp-scripts' Jest config and extend it for our plugin.
const wpJestPreset = require( '@wordpress/jest-preset-default/jest-preset' );
const wpScriptsConfig = require( '@wordpress/scripts/config/jest-unit.config' );

module.exports = {
	...wpScriptsConfig,
	rootDir: path.resolve( __dirname, '../..' ),
	setupFiles: [ ...( wpJestPreset.setupFiles || [] ), '<rootDir>/tests/js/polyfills.ts' ],
	setupFilesAfterEnv: [
		...( wpJestPreset.setupFilesAfterEnv || [] ),
		'<rootDir>/tests/js/setup.ts',
	],
	testMatch: [ '<rootDir>/tests/js/**/*.test.ts?(x)' ],
	moduleNameMapper: {
		...( wpScriptsConfig.moduleNameMapper || {} ),
		...( wpJestPreset.moduleNameMapper || {} ),
		'^@/(.*)$': '<rootDir>/src/$1',
	},
	transform: {
		'^.+\\.(t|j)sx?$': [
			'babel-jest',
			{
				presets: [
					'@babel/preset-env',
					[ '@babel/preset-react', { runtime: 'automatic' } ],
					'@babel/preset-typescript',
				],
			},
		],
	},
	// ESM-only packages need to be transformed by Jest. Common offenders: uuid,
	// nanoid, react-markdown chain, @tanstack/router-core, change-case, etc.
	transformIgnorePatterns: [
		'/node_modules/(?!(uuid|nanoid|@tanstack|change-case|escape-string-regexp|p-locate|locate-path|path-exists|find-up|@wordpress/route|@wordpress/admin-ui)/)',
	],
};
