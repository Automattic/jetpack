import { loadI18nCatalogs } from '@automattic/jetpack-wp-build-polyfills/src/js/load-i18n-catalogs';

/**
 * Load the Protect JS translation catalogs before the app renders.
 */
export async function init(): Promise< void > {
	await loadI18nCatalogs( 'jetpack-protect-pkg', import.meta.url );
}
