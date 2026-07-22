import { loadI18nCatalogs } from '@automattic/jetpack-wp-build-polyfills/src/js/load-i18n-catalogs';

/**
 * Load the VideoPress JS translation catalogs before the app renders.
 */
export async function init(): Promise< void > {
	await loadI18nCatalogs( 'jetpack-videopress-pkg', [
		'build/routes/library/content.js',
		'build/routes/overview/content.js',
		'build/routes/settings/content.js',
		'build/routes/video/content.js',
	] );
}
