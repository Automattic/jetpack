import { loadI18nCatalogs } from '@automattic/jetpack-wp-build-polyfills/src/js/load-i18n-catalogs';

/**
 * Provide the Jetpack config and load the Jetpack Backup JS translation catalogs before the app renders.
 */
export async function init(): Promise< void > {
	// wp-build has no `jetpackConfig` external, so @automattic/jetpack-config reads this global.
	( globalThis as typeof globalThis & { jetpackConfig?: object } ).jetpackConfig = {
		consumer_slug: 'jetpack-backup',
	};
	await loadI18nCatalogs( 'jetpack-backup-pkg', import.meta.url );
}
