import { loadI18nCatalogs } from '@automattic/jetpack-wp-build-polyfills/src/js/load-i18n-catalogs';
import { provideJetpackConfig } from './jetpack-config';

/**
 * Provide the Jetpack config and load the Activity Log JS translation catalogs before the app renders.
 */
export async function init(): Promise< void > {
	provideJetpackConfig();
	await loadI18nCatalogs( 'jetpack-activity-log', import.meta.url );
}
