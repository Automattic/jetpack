import { getScriptData } from '@automattic/jetpack-script-data';
import { loadI18nCatalogs } from '@automattic/jetpack-wp-build-polyfills/src/js/load-i18n-catalogs';
import apiFetch from '@wordpress/api-fetch';
import type { SocialScriptData } from '../../../_inc/types';

/**
 * Fetch the data the dashboard reads as `JetpackScriptData.social`, which no admin page prints inline.
 */
async function loadSocialScriptData(): Promise< void > {
	const social = await apiFetch< SocialScriptData >( { path: '/wpcom/v2/publicize/script-data' } );
	// Replaces whatever the host page printed: other Jetpack pages print `social` as `[]`.
	( getScriptData() as { social?: SocialScriptData } ).social = social;
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
