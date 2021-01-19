/**
 * External dependencies
 */
import getRedirectUrl from 'lib/jp-redirect';

export const imagePath = window.Initial_State.pluginBaseUrl + '/images/';
export const JETPACK_CONTACT_SUPPORT = getRedirectUrl( 'jetpack-contact-support' );
export const JETPACK_CONTACT_BETA_SUPPORT = getRedirectUrl( 'jetpack-contact-support-beta-group' );
export const JETPACK_AUTOLOAD_DEV_INFO =
	'https://github.com/Automattic/jetpack/tree/master/packages/autoloader#working-with-development-versions-of-packages';
