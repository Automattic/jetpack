import { loadI18nCatalogs } from '@automattic/jetpack-wp-build-polyfills/src/js/load-i18n-catalogs';

/**
 * Load the Jetpack Backup JS translation catalogs before the app renders.
 */
export async function init(): Promise< void > {
	await loadI18nCatalogs( 'jetpack-backup-pkg', [
		'build/routes/dashboard/content.js',
		'build/routes/download/content.js',
		'build/routes/restore/content.js',
	] );
}
