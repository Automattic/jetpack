// This directory contains Playwright tests, not jest tests. Configure accordingly.

import { makeBaseConfig, defineConfig } from 'jetpack-js-tools/eslintrc/base.mjs';
import playwrightConfig from 'jetpack-js-tools/eslintrc/playwright.mjs';

export default defineConfig(
	makeBaseConfig( import.meta.url, { envs: [ 'node' ] } ),
	playwrightConfig,
	{
		rules: {
			// Specs skip themselves when a surface has no post for their scenario.
			'playwright/no-skipped-test': 'off',
			// Playwright's fixture `use` callback is not a React hook.
			'react-hooks/rules-of-hooks': 'off',
		},
	}
);
