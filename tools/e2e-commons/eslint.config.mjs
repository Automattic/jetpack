import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { makeBaseConfig, defineConfig } from 'jetpack-js-tools/eslintrc/base.mjs';
import playwrightConfig from 'jetpack-js-tools/eslintrc/playwright.mjs';

/**
 * Create eslint config for E2Es.
 *
 * @param {string}   configurl       - File URL for the eslint.config.mjs. Pass `import.meta.url`.
 * @param {object}   opts            - Options
 * @param {string[]} opts.envs       - Sets of globals to use. Default `[ 'browser' ]`.
 * @param {string}   opts.textdomain - Text domain for `@wordpress/i18n-text-domain` rule.
 * @return {object[]} Eslint config.
 */
export function makeE2eConfig( configurl, opts = {} ) {
	opts.envs ??= [ 'node' ];

	const configDir = dirname( fileURLToPath( configurl ) );

	return defineConfig( makeBaseConfig( configurl, opts ), playwrightConfig, {
		languageOptions: {
			globals: {
				wp: true,
				jpConnect: true,
			},
		},
		settings: {
			'import/resolver': {
				typescript: {
					project: join( configDir, 'tsconfig.json' ),
				},
			},
		},
		rules: {
			'no-console': 'off',
			'n/no-process-exit': 'off',
			'playwright/no-skipped-test': 'off',
			'react-hooks/rules-of-hooks': 'off',
		},
	} );
}

export default makeE2eConfig( import.meta.url );
