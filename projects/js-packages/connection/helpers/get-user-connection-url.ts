import { getJetpackAdminPageUrl, getMyJetpackUrl } from '@automattic/jetpack-script-data';
import { addQueryArgs } from '@wordpress/url';

export type UserConnectionUrlOptions = {
	redirectUrl?: string | null;
	from?: string | null;
	skip_pricing?: boolean | null;
};

/**
 * Generates the user connection URL.
 *
 * @param options - Options for generating the user connection URL.
 *
 * @return The URL for user connection.
 */
export function getUserConnectionUrl( options: UserConnectionUrlOptions = {} ): string {
	const { redirectUrl, from, skip_pricing = true } = options;

	return addQueryArgs( getJetpackAdminPageUrl(), {
		// 'connect_url_redirect' is handled in \Automattic\Jetpack\Connection\Webhooks::controller()
		connect_url_redirect: 1,
		redirect_after_auth: redirectUrl ?? getMyJetpackUrl(),
		from: from ?? 'my-jetpack',
		skip_pricing,
	} );
}
