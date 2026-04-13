/**
 * Storybook-only unlock utility for accessing private WordPress APIs.
 *
 * WordPress packages like `@wordpress/theme` gate their `ThemeProvider` behind
 * `@wordpress/private-apis`. The unlock mechanism is restricted to core modules,
 * but Storybook stories are development-only code that never ships in the
 * production build, so the trade-off is acceptable.
 */

import { __dangerousOptInToUnstableAPIsOnlyForCoreModules } from '@wordpress/private-apis';

export const { unlock } = __dangerousOptInToUnstableAPIsOnlyForCoreModules(
	'I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.',
	'@wordpress/theme'
);
