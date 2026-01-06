import path from 'path';
import { fileURLToPath } from 'url';
import baseConfig from 'jetpack-js-tools/jest/config.base.js';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );

export default {
	...baseConfig,
	rootDir: path.join( __dirname, '..' ),
	setupFilesAfterEnv: [ ...baseConfig.setupFilesAfterEnv, '<rootDir>/tests/jest.setup.js' ],
	moduleNameMapper: {
		...baseConfig.moduleNameMapper,
		'^@wordpress/route$': '<rootDir>/tests/js/__mocks__/@wordpress/route.js',
		'^@tanstack/react-router$': '<rootDir>/tests/js/__mocks__/@tanstack/react-router.js',
	},
};
