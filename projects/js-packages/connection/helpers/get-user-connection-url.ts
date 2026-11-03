import { getJetpackAdminPageUrl, getMyJetpackUrl } from '@automattic/jetpack-script-data';
import { addQueryArgs } from '@wordpress/url';
import { isUnifiedConnectionFlow } from './connection-from';
import { warnOnce } from './warn-once';

export type UserConnectionUrlOptions = {
	/**
	 * The absolute URL to redirect to after authentication.
	 *
	 * Defaults to the My Jetpack URL if not provided. That default is deprecated: always pass one.
	 */
	redirect_url?: string | null;

	/**
	 * The `from` to pass to Calypso for identification, from `CONNECTION_FROM`.
	 *
	 * This is typically used to identify the source of the connection request.
	 * If not provided, defaults to 'my-jetpack'. That default is deprecated: always pass one.
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
 * Warns a developer about a link that WordPress.com would mislabel or return to the wrong page.
 *
 * @param options - The options the caller passed.
 */
function warnAboutDeprecatedOptions( options: UserConnectionUrlOptions ): void {
	const { from, redirect_url } = options;

	if ( from == null ) {
		warnOnce(
			'missing-from',
			'getUserConnectionUrl() was called without `from`, so WordPress.com records the connection as "my-jetpack". Pass a name from CONNECTION_FROM.'
		);
	} else if ( ! isUnifiedConnectionFlow( from ) ) {
		warnOnce(
			'legacy-from',
			`getUserConnectionUrl() was called with \`from\` "${ from }", which is not a standard entry-point name, so WordPress.com shows its legacy connection screen. Pass a name from CONNECTION_FROM.`
		);
	}

	if ( redirect_url == null ) {
		warnOnce(
			'missing-redirect-url',
			'getUserConnectionUrl() was called without `redirect_url`, so the user returns to My Jetpack. Pass the absolute URL to return to.'
		);
	}
}

/**
 * Generates the user connection URL.
 *
 * Omitting `from` or `redirect_url` is deprecated. In development, that or a `from` that
 * `isUnifiedConnectionFlow()` rejects logs a warning, once per page for each problem.
 *
 * @param options - Options for generating the user connection URL.
 *
 * @return The URL for user connection.
 */
export function getUserConnectionUrl( options: UserConnectionUrlOptions = {} ): string {
	warnAboutDeprecatedOptions( options );

	const { redirect_url, from, skip_pricing = true } = options;

	return addQueryArgs( getJetpackAdminPageUrl(), {
		// 'connect_url_redirect' is handled in \Automattic\Jetpack\Connection\Webhooks::controller()
		connect_url_redirect: 1,
		redirect_after_auth: redirect_url ?? getMyJetpackUrl(),
		from: from ?? 'my-jetpack',
		skip_pricing,
	} );
}
