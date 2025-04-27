import makeBaseConfig, { makeEnvConfig } from 'jetpack-js-tools/eslintrc/base.mjs';

export default [
	...makeBaseConfig( import.meta.url ),
	makeEnvConfig( 'jquery', [
		'src/features/custom-css/custom-css/js/**',
		'src/features/logo-tool/js/**',
	] ),
	{
		rules: {
			'testing-library/prefer-screen-queries': 'off',
			'react/jsx-no-bind': 'off',
		},
	},
];
