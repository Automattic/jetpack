// This directory contains Playwright tests, not jest tests. Configure accordingly.

import { makeBaseConfig, defineConfig } from 'jetpack-js-tools/eslintrc/base.mjs';
import playwrightConfig from 'jetpack-js-tools/eslintrc/playwright.mjs';

export default defineConfig(
	makeBaseConfig( import.meta.url, { envs: [ 'node' ] } ),
	playwrightConfig
);
