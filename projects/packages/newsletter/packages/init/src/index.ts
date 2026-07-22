import { loadI18nCatalogs } from '@automattic/jetpack-wp-build-polyfills/src/js/load-i18n-catalogs';

/**
 * Load the Newsletter JS translation catalogs before the app renders.
 *
 * Shared by both the Newsletter settings dashboard and the Subscribers
 * announcement page, so it lists both route bundles.
 */
export async function init(): Promise< void > {
	await loadI18nCatalogs( 'jetpack-newsletter', [
		'build/routes/dashboard/content.js',
		'build/routes/subscribers-announcement/content.js',
	] );
}
