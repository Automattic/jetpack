import { loadI18nCatalogs } from '@automattic/jetpack-wp-build-polyfills/src/js/load-i18n-catalogs';

/**
 * Provide the Jetpack config and load Podcast's translation catalogs before the dashboard renders.
 */
export async function init(): Promise< void > {
	/*
	 * wp-build has no `jetpackConfig` external, so @automattic/jetpack-config reads this global.
	 * The slug is `jetpack` because only the Jetpack plugin loads this page.
	 */
	( globalThis as typeof globalThis & { jetpackConfig?: object } ).jetpackConfig = {
		consumer_slug: 'jetpack',
	};
	await loadI18nCatalogs( 'jetpack-podcast', import.meta.url );
}
