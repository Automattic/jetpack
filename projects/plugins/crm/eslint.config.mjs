import { makeBaseConfig, defineConfig } from 'jetpack-js-tools/eslintrc/base.mjs';

export default defineConfig(
	makeBaseConfig( import.meta.url, {
		envs: [ 'browser', 'jquery' ],
	} ),
	{
		rules: {
			'jsdoc/require-jsdoc': 'off',
		},
	}
);
