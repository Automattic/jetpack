import { defineConfig, makeBaseConfig } from 'jetpack-js-tools/eslintrc/base.mjs';

export default defineConfig(
	// The app is Preact via `preact/compat`, so the React rules apply even though
	// `react` itself isn't a dependency for auto-detection to find.
	makeBaseConfig( import.meta.url, { react: true } ),
	{
		// Pin the version rather than "detect", which can't find a `react` package here.
		settings: { react: { version: '18.0' } },
		rules: {
			'react/jsx-no-bind': 'off',
		},
	}
);
