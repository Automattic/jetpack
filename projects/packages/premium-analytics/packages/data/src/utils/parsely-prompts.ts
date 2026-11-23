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

type ParselySignupSite = {
	/** The site's home URL; the signup page reads its host. */
	url?: string;
	/** The site title, offered as the organization name. */
	title?: string;
};

/**
 * The Parse.ly self-serve signup page, with the site filled in as far as it is known.
 *
 * @param site - The site's URL and title.
 * @return The signup URL.
 */
export function getParselySignupUrl( site: ParselySignupSite = {} ): string {
	const url = new URL( PARSELY_SIGNUP_URL );

	url.searchParams.set( 'utm_source', 'jetpack' );
	if ( site.title ) {
		url.searchParams.set( 'publisher_name', site.title );
	}
	const domain = parseHostname( site.url );
	if ( domain ) {
		url.searchParams.set( 'site_domain', domain );
	}

	return url.toString();
}

function parseHostname( siteUrl?: string ): string {
	try {
		return siteUrl ? new URL( siteUrl ).hostname : '';
	} catch {
		return '';
	}
}
