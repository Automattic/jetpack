// This directory contains Playwright tests, not jest tests. Configure accordingly.

import { makeBaseConfig, defineConfig } from 'jetpack-js-tools/eslintrc/base.mjs';
import playwrightConfig from 'jetpack-js-tools/eslintrc/playwright.mjs';

export default defineConfig(
	makeBaseConfig( import.meta.url, { envs: [ 'node' ] } ),
	playwrightConfig,
	{
		rules: {
			// Specs skip themselves when a surface has no post for their scenario. An
			// unconditional skip is still worth catching.
			'playwright/no-skipped-test': [ 'warn', { allowConditional: true } ],
			// VerbumForm.submit() asserts the comment published, so a spec ending there
			// is not assertion-free.
			'playwright/expect-expect': [ 'warn', { assertFunctionNames: [ 'submit' ] } ],
		},
	},
	{
		files: [ 'fixtures.ts' ],
		rules: {
			// Playwright's fixture `use` callback is not a React hook.
			'react-hooks/rules-of-hooks': 'off',
		},
	}
);
