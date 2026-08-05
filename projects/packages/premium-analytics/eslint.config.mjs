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
		// `packages/fields` carries field controls copied from the
		// widgets-toolkit port and keeps the same upstream style.
		files: [ 'packages/ui/**', 'packages/fields/**' ],
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
	},
	{
		// Same as the ui package: soften JSDoc rules for the widgets-toolkit
		// port and allow the upstream inline-handler JSX style. Temporary —
		// tighten these up in a follow-up alongside the other ports.
		// The port also keeps a few upstream patterns as-is:
		// - intentional `any` escapes in test fixtures and the router search
		//   record (see use-attributes-with-search-fallback.ts)
		// - `__experimental*` imports from `@wordpress/components`
		//   (ToggleGroupControl, Grid) that have no stable equivalents yet
		// - CIAB design-system tokens not yet in the local token inventory,
		//   plus raw/dynamic token names required by the `@automattic/charts`
		//   theme contract (see use-chart-theme.ts, metric-value.tsx)
		files: [ 'packages/widgets-toolkit/**' ],
		rules: {
			'jsdoc/require-jsdoc': 'off',
			'jsdoc/require-description': 'off',
			'jsdoc/require-param': 'off',
			'jsdoc/require-param-description': 'off',
			'jsdoc/require-returns': 'off',
			'jsdoc/check-indentation': 'off',
			'jsdoc/escape-inline-tags': 'off',
			'react/jsx-no-bind': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
			'@wordpress/no-unsafe-wp-apis': 'off',
			'@wordpress/no-unknown-ds-tokens': 'off',
		},
	},
	{
		// Ported widget wrappers and stories keep the upstream JSDoc style, and
		// import internal link packages whose deps are declared on the parent
		// manifest.
		files: [ 'widgets/**', 'projects/packages/premium-analytics/widgets/**' ],
		rules: {
			'import/order': 'off',
			'jsdoc/require-jsdoc': 'off',
			'jsdoc/require-description': 'off',
			'jsdoc/require-param': 'off',
			'jsdoc/require-param-description': 'off',
			'jsdoc/require-returns': 'off',
			'jsdoc/check-indentation': 'off',
			'jsdoc/escape-inline-tags': 'off',
			'import/no-extraneous-dependencies': 'off',
		},
	},
	{
		// Each package under `packages/` that declares `wpScriptModuleExports`
		// is a shared script module, so a direct import of one of these
		// libraries compiles it *into* that module instead of resolving to the
		// externals module — which is what made an unrelated one-line change
		// rewrite megabytes of build output (WOOA7S-1836).
		//
		// Covers all of `packages/**`, including the packages that are bundled
		// from source rather than compiled to their own module: they end up
		// inside whichever module imports them, so a direct import there costs
		// the same. `widgets/` and `routes/` are covered by the block below,
		// which adds the charts-via-toolkit rule on top.
		//
		// `packages/externals` is deliberately excluded: it *is* the
		// passthrough, so it has to import them directly.
		files: [ 'packages/**', 'projects/packages/premium-analytics/packages/**' ],
		ignores: [
			'packages/externals/**',
			'projects/packages/premium-analytics/packages/externals/**',
		],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							// Matches the libraries and their subpath entries
							// (e.g. `@automattic/charts/visx/legend`) but not
							// stylesheet side-effect imports: those are plain
							// CSS, not the library, so they carry none of the
							// bundling cost.
							regex:
								'^(@automattic/charts|@automattic/ui|@wordpress/ui|@wordpress/dataviews)(/(?!.*\\.css$).*)?$',
							message:
								'Import these from @jetpack-premium-analytics/externals instead: it compiles them once into a shared script module rather than into every module that imports them. Missing an export? Add it to packages/externals/src/index.ts.',
						},
					],
				},
			],
		},
	},
	{
		// Widget render bundles and route bundles are lazy-loaded on their own,
		// so a direct import of one of these libraries is inlined into that
		// bundle rather than resolved from a shared script module.
		//
		// Charts are called out separately: they must come through
		// widgets-toolkit, which themes them and takes charts from externals
		// itself, so a toolkit passthrough costs nothing. Everything else goes
		// straight to externals.
		//
		// Both rules live in one block on purpose — a second `files` entry
		// naming `no-restricted-imports` again would replace this rule for
		// these paths rather than add to it.
		files: [
			'widgets/**',
			'routes/**',
			'projects/packages/premium-analytics/widgets/**',
			'projects/packages/premium-analytics/routes/**',
		],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							// Same `.css` exemption as the packages rule above.
							regex: '^@automattic/charts(/(?!.*\\.css$).*)?$',
							message:
								'Import chart components from @jetpack-premium-analytics/widgets-toolkit instead: it is a shared script module, so charts is bundled once for the whole dashboard. Missing a component? Re-export it from the toolkit "Charts passthrough" section.',
						},
						{
							regex: '^(@automattic/ui|@wordpress/ui|@wordpress/dataviews)(/(?!.*\\.css$).*)?$',
							message:
								'Import these from @jetpack-premium-analytics/externals instead: it compiles them once into a shared script module rather than into every bundle that imports them. Missing an export? Add it to packages/externals/src/index.ts.',
						},
					],
				},
			],
		},
	}
);
