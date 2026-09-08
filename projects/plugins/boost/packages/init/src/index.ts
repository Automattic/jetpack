import { loadI18nCatalogs } from '@automattic/jetpack-wp-build-polyfills/src/js/load-i18n-catalogs';

/** Load Boost's translation catalogs before rendering. */
export async function init(): Promise< void > {
	await loadI18nCatalogs( 'jetpack-boost', import.meta.url );
}
