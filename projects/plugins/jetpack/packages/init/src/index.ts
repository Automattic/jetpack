import { trackViewTransitions } from '@automattic/jetpack-admin-ui/src/admin-shell/view-transitions';
import { loadI18nCatalogs } from '@automattic/jetpack-wp-build-polyfills/src/js/load-i18n-catalogs';
import { provideJetpackConfig } from './jetpack-config';

/**
 * Provide the Jetpack config and load the JS translation catalogs before the app renders.
 */
export async function init(): Promise< void > {
	provideJetpackConfig();
	// Settings' hash redirects on load start back-to-back route transitions, which skip each other.
	trackViewTransitions();
	await loadI18nCatalogs( 'jetpack', import.meta.url );
}
