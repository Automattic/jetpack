import { getJetpackAdminPageUrl, getMyJetpackUrl } from '@automattic/jetpack-script-data';
import { addQueryArgs } from '@wordpress/url';

export type UserConnectionUrlOptions = {
	/**
	 * The URL to redirect to after authentication.
	 *
	 * Defaults to the My Jetpack URL if not provided.
	 */
	redirect_url?: string | null;

	/**
	 * The `from` to pass to Calypso for identification.
	 *
	 * This is typically used to identify the source of the connection request.
	 * If not provided, defaults to 'my-jetpack'.
	 */
	from?: string | null;

	/**
	 * Whether to skip the pricing page after authentication.
	 *
	 * @default true
	 */
	skip_pricing?: boolean;
};

/**
 * Generates the user connection URL.
 *
 * @param options - Options for generating the user connection URL.
 *
 * @return The URL for user connection.
 */
export function getUserConnectionUrl( options: UserConnectionUrlOptions = {} ): string {
	const { redirect_url, from, skip_pricing = true } = options;

	return addQueryArgs( getJetpackAdminPageUrl(), {
		// 'connect_url_redirect' is handled in \Automattic\Jetpack\Connection\Webhooks::controller()
		connect_url_redirect: 1,
		redirect_after_auth: redirect_url ?? getMyJetpackUrl(),
		from: from ?? 'my-jetpack',
		skip_pricing,
	} );
}
