import makeBaseConfig from 'jetpack-js-tools/eslintrc/base.mjs';
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

	return [
		...makeBaseConfig( configurl, { envs: [ 'node' ] } ),
		...playwrightConfig,
		{
			languageOptions: {
				globals: {
					wp: true,
					jpConnect: true,
				},
			},
			rules: {
				'no-console': 'off',
				'n/no-process-exit': 'off',
				'playwright/no-skipped-test': 'off',
				// False positives when using `page.getByRole()`
				'testing-library/prefer-screen-queries': 'off',
			},
		},
	];
}

export default [ ...makeE2eConfig( import.meta.url ) ];
