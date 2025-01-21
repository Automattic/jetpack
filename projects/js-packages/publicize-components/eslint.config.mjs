import makeBaseConfig, { config } from '@automattic/jetpack-js-tools/eslintrc/base.mjs';
import jestConfig from '@automattic/jetpack-js-tools/eslintrc/jest.mjs';

export default [
	...makeBaseConfig( import.meta.url ),
	...config( {
		files: [ 'src/utils/test-factory.js' ],
		extends: [ jestConfig ],
	} ),
];
