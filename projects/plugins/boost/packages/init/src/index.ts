import { loadI18nCatalogs } from '@automattic/jetpack-wp-build-polyfills/src/js/load-i18n-catalogs';
import { initLocationChange } from './location-change';

/** Load Boost's translation catalogs before rendering. */
export async function init(): Promise< void > {
	initLocationChange();
	await loadI18nCatalogs( 'jetpack-boost', import.meta.url );
}
