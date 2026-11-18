/**
 * External dependencies
 */
import { loadI18nCatalogs } from '@automattic/jetpack-wp-build-polyfills/src/js/load-i18n-catalogs';

/**
 * Loads the translations of the surface.
 *
 * On its own so tests can load the entry point: Jest does not parse `import.meta`.
 *
 * @return A promise that resolves once the catalogs are installed, or could not be.
 */
export function loadTranslations(): Promise< void > {
	return loadI18nCatalogs( 'jetpack-announcements', import.meta.url );
}
