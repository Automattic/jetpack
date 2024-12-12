import makeBaseConfig, { config } from 'jetpack-js-tools/eslintrc/base.mjs';
import jestConfig from 'jetpack-js-tools/eslintrc/jest.mjs';

export default [
	...makeBaseConfig( import.meta.url ),
	...config( {
		files: [ 'src/utils/test-factory.js' ],
		extends: [ jestConfig ],
	} ),
];
