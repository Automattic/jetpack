import { fileURLToPath } from 'url';
import coverageConfig from 'jetpack-js-tools/jest/config.coverage.js';

export default {
	...coverageConfig,
	rootDir: fileURLToPath( new URL( '..', import.meta.url ) ),
	roots: [ '<rootDir>/src/', '<rootDir>/tests/' ],
	resolver: fileURLToPath( import.meta.resolve( 'jetpack-js-tools/jest/jest-resolver.js' ) ),
	setupFilesAfterEnv: [
		fileURLToPath( import.meta.resolve( 'jetpack-js-tools/jest/setup-console.js' ) ),
	],
};
