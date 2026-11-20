/**
 * Provide the `jetpackConfig` that webpack.config.js declares as an external, which esbuild cannot.
 */
export function provideJetpackConfig(): void {
	( globalThis as typeof globalThis & { jetpackConfig?: object } ).jetpackConfig = {
		consumer_slug: 'my_jetpack',
	};
}
