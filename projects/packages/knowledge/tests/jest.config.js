import path from 'path';
import baseConfig from 'jetpack-js-tools/jest/config.base.js';

export default {
	...baseConfig,
	rootDir: path.join( import.meta.dirname, '..' ),
};
