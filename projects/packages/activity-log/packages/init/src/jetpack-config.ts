/**
 * Provide the `jetpackConfig` global that `@automattic/jetpack-config` reads, since wp-build has no such external.
 *
 * Set here, not in PHP: the admin shell keeps a host page's inline `jetpackConfig` over a guest's.
 */
export function provideJetpackConfig(): void {
	( globalThis as typeof globalThis & { jetpackConfig?: object } ).jetpackConfig = {
		consumer_slug: 'jetpack-activity-log',
	};
}
