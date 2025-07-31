import { getJetpackAdminPageUrl, getMyJetpackUrl } from '@automattic/jetpack-script-data';
import { addQueryArgs } from '@wordpress/url';

/**
 * Generates the user connection URL.
 *
 * @param redirectUrl - Optional redirect URL after connection. Defaults to the My Jetpack URL.
 *
 * @return The URL for user connection.
 */
export function getUserConnectionUrl( redirectUrl?: string | null ): string {
	return addQueryArgs( getJetpackAdminPageUrl(), {
		// 'connect_url_redirect' is handled in \Automattic\Jetpack\Connection\Webhooks::controller()
		connect_url_redirect: 1,
		redirect_after_auth: redirectUrl ?? getMyJetpackUrl(),
	} );
}
