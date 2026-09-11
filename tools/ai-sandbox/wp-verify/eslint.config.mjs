import { makeBaseConfig, defineConfig } from 'jetpack-js-tools/eslintrc/base.mjs';
import playwrightConfig from 'jetpack-js-tools/eslintrc/playwright.mjs';

/**
 * ESLint config for the wp-verify Playwright Test suite.
 *
 * `@playwright/test` is installed globally inside `jetpack-ai-sandbox` (see the
 * Dockerfile in `tools/ai-sandbox/`), not in any local `node_modules`, so the
 * `import/no-unresolved` rule can't see it from the host filesystem and is
 * scoped accordingly. The testing-library plugin's `prefer-screen-queries`
 * rule is also disabled because it misreads Playwright's per-test `page`
 * fixture destructuring (`async ({ page }) => …`) as React Testing Library's
 * `render()` return.
 */
export default defineConfig(
	makeBaseConfig( import.meta.url, { envs: [ 'node' ] } ),
	playwrightConfig,
	{
		rules: {
			// @playwright/test is installed globally inside jetpack-ai-sandbox, not in a
			// local node_modules — ESLint can't resolve it from the host filesystem.
			'import/no-unresolved': [ 'error', { ignore: [ '^@playwright/test$' ] } ],

			// Misreads Playwright's `async ({ page }) => …` fixture destructuring as the
			// React Testing Library `render()` return.
			'testing-library/prefer-screen-queries': 'off',

			// The verify suite still uses page.fill/click/goto and page.$eval/$$eval/
			// page.waitForSelector. They work, are explicit, and match the existing
			// check.cjs idiom. Converting to locator API is tracked separately; until
			// then these are noisy non-issues.
			'playwright/prefer-locator': 'off',
			'playwright/no-wait-for-selector': 'off',
			'playwright/no-eval': 'off',

			// We have legitimate skips (test.describe.skip for pie-chart-tooltip until
			// a chart exists; test.skip() inside the SVG check when the dashboard is
			// chartless) and one conditional (boundingBox null guard).
			'playwright/no-skipped-test': 'off',
			'playwright/no-conditional-in-test': 'off',

			'no-console': 'off',
		},
	}
);
