import path from 'path';
import { fileURLToPath } from 'url';
import baseConfig from 'jetpack-js-tools/jest/config.base.js';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );

export default {
	...baseConfig,
	rootDir: path.join( __dirname, '..' ),
	setupFilesAfterEnv: [ ...baseConfig.setupFilesAfterEnv, '<rootDir>/tests/jest.setup.js' ],

	// Hack so the ESM-only `@wordpress/interactivity` can be used with Jest in CommonJS mode.
	// @todo Run Jest in ESM mode so this isn't needed.
	transformIgnorePatterns: [ '/node_modules/(?!.pnpm/|@wordpress/interactivity/)' ],
	resolver: require.resolve( './jest-resolver.js' ),
};
