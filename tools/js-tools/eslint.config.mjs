import makeBaseConfig, { config } from 'jetpack-js-tools/eslintrc/base.mjs';
import jestConfig from 'jetpack-js-tools/eslintrc/jest.mjs';

export default [
	...makeBaseConfig( import.meta.url, { envs: [ 'node' ] } ),
	{
		rules: {
			'no-console': 'off',
			'n/no-process-exit': 'off',
		},
	},
	...config( {
		files: [ 'jest/setup-*.js' ],
		extends: [ jestConfig ],
	} ),
];
