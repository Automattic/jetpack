import { loadI18nCatalogs } from '@automattic/jetpack-wp-build-polyfills/src/js/load-i18n-catalogs';

/**
 * Load the Knowledge JS translation catalogs before the app renders.
 */
export async function init(): Promise< void > {
	await loadI18nCatalogs( 'jetpack-knowledge', import.meta.url );
}
