import makeBaseConfig, { typescriptFiles, makeEnvConfig } from 'jetpack-js-tools/eslintrc/base.mjs';

export default [
	...makeBaseConfig( import.meta.url ),
	makeEnvConfig( 'jquery', [ 'src/features/custom-css/custom-css/js/**' ] ),
	{
		rules: {
			'testing-library/prefer-screen-queries': 'off',
			'react/jsx-no-bind': 'off',
			// @todo Turn these back on for JS here. The block below handles TS.
			'jsdoc/require-returns': 'off',
			'jsdoc/require-param-type': 'off',
		},
	},
	{
		files: typescriptFiles,
		rules: {
			// Not needed for TypeScript.
			'jsdoc/require-param-type': 'off',
			'jsdoc/require-returns-type': 'off',
		},
	},
];
