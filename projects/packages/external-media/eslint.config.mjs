import makeBaseConfig from 'jetpack-js-tools/eslintrc/base.mjs';

export default [
	...makeBaseConfig( import.meta.url ),
	{
		rules: {
			'react/jsx-no-bind': 'off',
		},
	},
];
