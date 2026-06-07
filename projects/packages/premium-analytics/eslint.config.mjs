import { makeBaseConfig, defineConfig } from 'jetpack-js-tools/eslintrc/base.mjs';

/**
 * Soften JSDoc rules for `packages/datetime/**` and `packages/formatters/**`
 * so the initial ports can land with the upstream JSDoc style (descriptions
 * on the function body, not on per-param tags). Temporary — backfill proper
 * JSDoc on the helpers and remove these overrides (at which point this whole
 * file can go away).
 */
export default defineConfig(
	makeBaseConfig( import.meta.url ),
	{
		files: [ 'packages/datetime/**' ],
		rules: {
			'jsdoc/require-description': 'off',
			'jsdoc/require-param-description': 'off',
			'jsdoc/require-returns': 'off',
			'jsdoc/check-indentation': 'off',
		},
	},
	{
		files: [ 'packages/formatters/**' ],
		rules: {
			'jsdoc/require-description': 'off',
			'jsdoc/require-param': 'off',
			'jsdoc/require-param-description': 'off',
			'jsdoc/require-returns': 'off',
			'jsdoc/check-indentation': 'off',
		},
	},
	{
		// Dashboard route + bundled widgets: the initial dashboard port consumes
		// vendored engine packages and uses core's import-group and JSDoc style.
		// Soften the conflicting rules so it can land.
		files: [ 'routes/dashboard/**', 'widgets/**' ],
		rules: {
			'import/order': 'off',
			'jsdoc/require-description': 'off',
			'jsdoc/require-param-description': 'off',
			'jsdoc/require-returns': 'off',
			'jsdoc/check-indentation': 'off',
		},
	}
);
