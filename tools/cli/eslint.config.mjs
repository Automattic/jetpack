import { makeBaseConfig, defineConfig } from 'jetpack-js-tools/eslintrc/base.mjs';

export default defineConfig(
	makeBaseConfig( import.meta.url, { envs: [ 'node' ] } ),
	{
		rules: {
			'no-console': 'off',
			'n/no-process-exit': 'off',
		},
	},
	// Skeleton intentionally uses an invalid name.
	{
		files: [ 'skeletons/common/package.json' ],
		rules: {
			'package-json/valid-name': 'off',
		},
	},
	// Test fixtures don't need these rules.
	{
		files: [ 'tests/data/**/package.json' ],
		rules: {
			'package-json/require-exports': 'off',
			'package-json/require-repository': 'off',
			'package-json/require-attribution': 'off',
		},
	}
);
