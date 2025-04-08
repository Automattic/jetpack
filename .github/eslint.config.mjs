import makeBaseConfig from 'jetpack-js-tools/eslintrc/base.mjs';

export default [
	...makeBaseConfig( import.meta.url, { envs: [ 'node' ] } ),
	{
		rules: {
			'no-console': 'off',
			'n/no-process-exit': 'off',
		},
	},
];
