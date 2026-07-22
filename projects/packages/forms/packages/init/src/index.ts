import { loadI18nCatalogs } from '@automattic/jetpack-wp-build-polyfills/src/js/load-i18n-catalogs';

/**
 * Load the Jetpack Forms JS translation catalogs before the app renders.
 */
export async function init(): Promise< void > {
	await loadI18nCatalogs( 'jetpack-forms', [
		'build/routes/forms/content.js',
		'build/routes/response/content.js',
		'build/routes/responses/content.js',
	] );
}
