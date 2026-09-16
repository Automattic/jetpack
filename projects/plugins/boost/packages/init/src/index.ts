import { loadI18nCatalogs } from '@automattic/jetpack-wp-build-polyfills/src/js/load-i18n-catalogs';

/** Provide the Jetpack config and load Boost's translation catalogs before rendering. */
export async function init(): Promise< void > {
	// wp-build has no `jetpackConfig` external, so @automattic/jetpack-config reads this global.
	( globalThis as typeof globalThis & { jetpackConfig?: object } ).jetpackConfig = {
		consumer_slug: 'jetpack-boost',
	};
	await loadI18nCatalogs( 'jetpack-boost', import.meta.url );
}
