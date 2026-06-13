/**
 * Back-compat re-export.
 *
 * The `wordpress-com/plans` store moved to `@automattic/jetpack-shared-stores`
 * so it can be externalized into a single bundle and registered only once.
 * This shim preserves the historical `@automattic/jetpack-shared-extension-utils/store/wordpress-com`
 * import path for existing consumers.
 */
export { selectors, wordpressPlansStore } from '@automattic/jetpack-shared-stores';
export type * from '@automattic/jetpack-shared-stores';
