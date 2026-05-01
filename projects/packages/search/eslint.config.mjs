import { makeBaseConfig, defineConfig } from 'jetpack-js-tools/eslintrc/base.mjs';

export default defineConfig(
	makeBaseConfig( import.meta.url, { textdomain: 'jetpack-search-pkg' } ),
	{
		rules: {
			'react/jsx-no-bind': 'off',
		},
	}
);
