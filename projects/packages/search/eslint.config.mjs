import makeBaseConfig from 'jetpack-js-tools/eslintrc/base.mjs';

export default [
	...makeBaseConfig( import.meta.url, { react: true, textdomain: 'jetpack-search-pkg' } ),
	{
		rules: {
			'react/jsx-no-bind': 'off',
		},
	},
];
