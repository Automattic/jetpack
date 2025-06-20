import { makeBaseConfig, defineConfig, javascriptFiles } from 'jetpack-js-tools/eslintrc/base.mjs';

export default defineConfig( makeBaseConfig( import.meta.url ), {
	files: javascriptFiles,
	rules: {
		'@typescript-eslint/no-unused-vars': [
			'warn',
			{ argsIgnorePattern: '^_', caughtErrors: 'none' },
		],
	},
} );
