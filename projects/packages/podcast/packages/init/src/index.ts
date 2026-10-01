import { loadI18nCatalogs } from '@automattic/jetpack-wp-build-polyfills/src/js/load-i18n-catalogs';

/**
 * Load Podcast's translation catalogs before the dashboard renders.
 */
export async function init(): Promise< void > {
	await loadI18nCatalogs( 'jetpack-podcast', import.meta.url );
}
