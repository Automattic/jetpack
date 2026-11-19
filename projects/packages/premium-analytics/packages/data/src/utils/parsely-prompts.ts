/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';

const PARSELY_SIGNUP_URL = 'https://dash.parsely.com/self-serve';

/**
 * Whether the site and the reader qualify for the Upgrade to Parsely prompts.
 *
 * @return False when the server published no answer.
 */
export function offersParselyPrompts(): boolean {
	return getScriptData()?.premium_analytics?.offers_parsely_prompts === true;
}

/**
 * The Parsely self-serve signup page, with the site filled in when it is known.
 *
 * @param siteUrl - The site's home URL.
 * @return The signup URL.
 */
export function getParselySignupUrl( siteUrl?: string ): string {
	const url = new URL( PARSELY_SIGNUP_URL );

	url.searchParams.set( 'utm_source', 'jetpack' );
	if ( siteUrl ) {
		url.searchParams.set( 'url', siteUrl );
	}

	return url.toString();
}
