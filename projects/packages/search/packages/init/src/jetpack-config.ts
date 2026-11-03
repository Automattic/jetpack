/**
 * Provide the `jetpackConfig` global `@automattic/jetpack-config` reads, which esbuild cannot declare as an external.
 */
export function provideJetpackConfig(): void {
	( globalThis as typeof globalThis & { jetpackConfig?: object } ).jetpackConfig = {
		consumer_slug: 'jetpack-search',
	};
}
