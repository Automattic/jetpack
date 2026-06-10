import { makeBaseConfig, defineConfig } from 'jetpack-js-tools/eslintrc/base.mjs';

/**
 * Soften JSDoc rules for the internal `packages/*` ports so the initial
 * ports can land with the upstream JSDoc style (descriptions on the
 * function body, not on per-param tags). Temporary — backfill proper
 * descriptions on the helpers and remove these overrides (at which point
 * this whole file can go away).
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
		// The data port carries a couple of upstream patterns this temporary
		// override keeps as-is: intentional `any` escapes for the generic report
		// `TData` (see use-report.ts), and `react` flagged as extraneous because
		// the internal package's deps are declared on the parent manifest.
		files: [ 'packages/data/**' ],
		rules: {
			'jsdoc/require-description': 'off',
			'jsdoc/require-jsdoc': 'off',
			'jsdoc/require-param': 'off',
			'jsdoc/require-param-description': 'off',
			'jsdoc/require-returns': 'off',
			'jsdoc/check-indentation': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
			// TODO: this masks any genuinely-undeclared dep, not just the `react`
			// false-positive. Re-enable (or scope to the offending files) once the
			// leaf manifest becomes load-bearing in the first-consumer PR.
			'import/no-extraneous-dependencies': 'off',
		},
	},
	{
		// First UI package in the port: also soften JSDoc rules for the ui
		// package and allow the upstream inline-handler JSX style. Temporary —
		// tighten these up in a follow-up alongside datetime/formatters.
		files: [ 'packages/ui/**' ],
		rules: {
			'jsdoc/require-jsdoc': 'off',
			'jsdoc/require-description': 'off',
			'jsdoc/require-param': 'off',
			'jsdoc/require-param-description': 'off',
			'jsdoc/require-returns': 'off',
			'jsdoc/check-indentation': 'off',
			'jsdoc/escape-inline-tags': 'off',
			'react/jsx-no-bind': 'off',
		},
	},
	{
		// The routing port also imports `react` directly (the staged-search
		// hook), flagged as extraneous because the internal package's deps are
		// declared on the parent manifest.
		files: [ 'packages/routing/**' ],
		rules: {
			'jsdoc/require-jsdoc': 'off',
			'jsdoc/require-param': 'off',
			'jsdoc/require-returns': 'off',
			'jsdoc/check-indentation': 'off',
			'import/no-extraneous-dependencies': 'off',
		},
	}
);
