/**
 * Local unlock helper for reaching the private `Menu` component that
 * `@wordpress/components` exposes through `@wordpress/private-apis`.
 *
 * Upstream reached `Menu` via `@automattic/admin-toolkit`'s `unlock`, which is
 * not available in this monorepo. This mirrors existing Jetpack precedent that
 * opts in to the private APIs directly:
 *
 * - `projects/packages/jetpack-mu-wpcom/src/common/utils.ts` (`getUnlock()`)
 * - `projects/js-packages/charts/src/stories/unlock.ts`
 *
 * The opt-in module name only needs to be an allow-listed core module; the
 * returned `unlock` reads private data bound to any object, so it resolves the
 * private APIs locked onto `@wordpress/components`' `privateApis`.
 */

import { __dangerousOptInToUnstableAPIsOnlyForCoreModules } from '@wordpress/private-apis';

export const { unlock } = __dangerousOptInToUnstableAPIsOnlyForCoreModules(
	'I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.',
	'@wordpress/components'
);
