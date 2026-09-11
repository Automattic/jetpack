import { loadI18nCatalogs } from '@automattic/jetpack-wp-build-polyfills/src/js/load-i18n-catalogs';
import { provideJetpackConfig } from './jetpack-config';

/**
 * Provide the Jetpack config and load the JS translation catalogs before the app renders.
 */
export async function init(): Promise< void > {
	provideJetpackConfig();
	await loadI18nCatalogs( 'jetpack-my-jetpack', import.meta.url );
}
