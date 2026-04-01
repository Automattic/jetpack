import { makeBaseConfig, defineConfig } from 'jetpack-js-tools/eslintrc/base.mjs';

export default defineConfig(
	makeBaseConfig( import.meta.url, { envs: [ 'node' ] } ),
	{
		rules: {
			'no-console': 'off',
			'n/no-process-exit': 'off',
		},
	},
	{
		// The bin wrapper imports from build/ which doesn't exist until after build
		files: [ 'bin/**' ],
		rules: {
			'import/no-unresolved': 'off',
		},
	}
);
