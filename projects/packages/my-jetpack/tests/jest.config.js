import path from 'path';
import baseConfig from 'jetpack-js-tools/jest/config.base.js';

export default {
	...baseConfig,
	rootDir: path.join( import.meta.dirname, '..' ),
	setupFilesAfterEnv: [ ...baseConfig.setupFilesAfterEnv, '<rootDir>/tests/jest.setup.js' ],
	collectCoverageFrom: [
		'<rootDir>/_inc/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}',
		...baseConfig.collectCoverageFrom,
	],
};
