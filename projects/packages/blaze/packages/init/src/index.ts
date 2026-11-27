import { loadI18nCatalogs } from '@automattic/jetpack-wp-build-polyfills/src/js/load-i18n-catalogs';

/**
 * Provide the Jetpack config and load the dashboard's JS translation catalogs before the app renders.
 */
export async function init(): Promise< void > {
	// Set here, not in PHP: the admin shell keeps a host page's inline `jetpackConfig` over a guest's.
	( globalThis as typeof globalThis & { jetpackConfig?: object } ).jetpackConfig = {
		consumer_slug: 'jetpack-blaze',
	};
	await loadI18nCatalogs( 'jetpack-blaze', import.meta.url );
}
