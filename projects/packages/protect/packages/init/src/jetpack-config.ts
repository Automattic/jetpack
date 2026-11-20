/**
 * Provide the `jetpackConfig` global `@automattic/jetpack-config` reads, which esbuild cannot declare as an external.
 * The slug is `jetpack` because only the Jetpack plugin loads this page; the Protect plugin keeps its own.
 */
export function provideJetpackConfig(): void {
	( globalThis as typeof globalThis & { jetpackConfig?: object } ).jetpackConfig = {
		consumer_slug: 'jetpack',
	};
}
