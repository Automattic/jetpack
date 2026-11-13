import { createBlock } from '@wordpress/blocks';
import PlaceholderSiteIcon from './placeholder-site-icon.svg';

export function createBlockFromRecommendation( attrs ) {
	let trimmedURL;
	try {
		trimmedURL = new URL( attrs?.url )?.host.replace( /^www\./, '' );
	} catch {
		trimmedURL = attrs?.URL;
	}

	return createBlock( 'jetpack/blogroll-item', {
		...attrs,
		...( ! attrs.name && { name: trimmedURL } ),
	} );
}

export function createBlockFromSubscription( subscription ) {
	const { blog_id, site_icon, URL, name, description, is_non_wpcom_site, feed_URL, jetpack } =
		subscription;

	return createBlockFromRecommendation( {
		id: blog_id,
		icon: site_icon,
		url: URL,
		name,
		description,
		is_non_wpcom_site,
		feed_url:
			getValidFeedUrl( feed_URL ) || ( false === jetpack ? getWpcomFeedUrl( URL ) : undefined ),
	} );
}

export function getValidDomain( siteURL ) {
	if ( ! siteURL ) {
		return null;
	}

	const pattern = new RegExp(
		'^([a-zA-Z]+:\\/\\/)?' + // protocol
			'((([a-z\\d]([a-z\\d-]*[a-z\\d])?)\\.)+[a-z]{2,})', // domain name
		'i'
	);

	try {
		return new URL( siteURL )?.host;
	} catch {
		return siteURL.match( pattern )?.[ 2 ] ?? null;
	}
}

/**
 * The feed URL of a WordPress.com-hosted site, which always serves /feed/.
 *
 * Only safe for a site `/sites/` reports with `jetpack: false`: a Jetpack site with plain
 * permalinks serves its feed at `?feed=rss2`, so `/feed/` would be a 404 there.
 *
 * @param {string} siteURL - Site URL.
 * @return {string|undefined} Feed URL, or undefined without a site URL.
 */
export function getWpcomFeedUrl( siteURL ) {
	if ( ! siteURL ) {
		return undefined;
	}

	return `${ siteURL.replace( /\/$/, '' ) }/feed/`;
}

/**
 * Trim a feed URL and only keep it when it is an http(s) URL.
 *
 * @param {string} value - Feed URL as entered or returned by an API.
 * @return {string|undefined} Trimmed feed URL, or undefined when it is not valid.
 */
export function getValidFeedUrl( value ) {
	const feedUrl = value?.trim();
	if ( ! feedUrl ) {
		return undefined;
	}

	try {
		return [ 'http:', 'https:' ].includes( new URL( feedUrl ).protocol ) ? feedUrl : undefined;
	} catch {
		return undefined;
	}
}

/**
 * Discover the feed of a site through the WordPress.com Reader.
 *
 * @param {string} siteURL - Site URL or domain.
 * @return {Promise<string|undefined>} The first feed found, or undefined.
 */
export async function discoverFeedUrl( siteURL ) {
	try {
		const response = await fetch(
			`https://public-api.wordpress.com/rest/v1.1/read/feed/?url=${ encodeURIComponent( siteURL ) }`
		);
		if ( ! response.ok ) {
			return undefined;
		}

		const { feeds } = await response.json();
		return getValidFeedUrl( feeds?.[ 0 ]?.subscribe_URL );
	} catch {
		return undefined;
	}
}

export function getSiteIcon( siteIconURL ) {
	if ( ! siteIconURL ) {
		return PlaceholderSiteIcon;
	}
	return siteIconURL;
}
