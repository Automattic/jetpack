import { getScriptData } from '@automattic/jetpack-script-data';
import { loadI18nCatalogs } from '@automattic/jetpack-wp-build-polyfills/src/js/load-i18n-catalogs';
import apiFetch from '@wordpress/api-fetch';
import type { SocialScriptData } from '../../../_inc/types';

/**
 * Fetch `JetpackScriptData.social` when the page didn't print it, as when the admin shell opens Social on another dashboard's page.
 */
async function loadSocialScriptData(): Promise< void > {
	const scriptData = getScriptData() as { social?: SocialScriptData | [] };
	// Other Jetpack pages print `social` as `[]`, so check for a key Social always has.
	if ( scriptData.social && 'api_paths' in scriptData.social ) {
		return;
	}
	scriptData.social = await apiFetch< SocialScriptData >( {
		path: '/wpcom/v2/publicize/script-data',
	} );
}

/**
 * Provide the Jetpack config, then load Jetpack Social's page data and translation catalogs before the app renders.
 */
export async function init(): Promise< void > {
	// wp-build has no `jetpackConfig` external, so @automattic/jetpack-config reads this global.
	( globalThis as typeof globalThis & { jetpackConfig?: object } ).jetpackConfig = {
		consumer_slug: 'jetpack-social',
	};
	await Promise.all( [
		loadSocialScriptData(),
		loadI18nCatalogs( 'jetpack-publicize-pkg', import.meta.url ),
	] );
}
