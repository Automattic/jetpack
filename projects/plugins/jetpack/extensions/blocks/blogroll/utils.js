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
 * Normalize a feed URL and only keep it when it is an http(s) URL.
 *
 * @param {string} value - Feed URL as entered or returned by an API.
 * @return {string|undefined} Normalized feed URL, or undefined when it is not valid.
 */
export function getValidFeedUrl( value ) {
	const feedUrl = value?.trim();
	if ( ! feedUrl ) {
		return undefined;
	}

	try {
		const url = new URL( feedUrl );
		return [ 'http:', 'https:' ].includes( url.protocol ) ? url.href : undefined;
	} catch {
		return undefined;
	}
}

/**
 * Find the feed of a site: /feed/ for a WordPress.com-hosted site, Reader discovery otherwise.
 *
 * The Reader returns the site URL as the feed of a WordPress.com-hosted site, so ask /sites/ first.
 *
 * @param {string} siteURL - Site URL or domain.
 * @return {Promise<string|undefined>} The feed found, or undefined.
 */
export async function discoverFeedUrl( siteURL ) {
	const domain = getValidDomain( siteURL );
	if ( ! domain ) {
		return undefined;
	}

	try {
		const siteResponse = await fetch(
			`https://public-api.wordpress.com/rest/v1.1/sites/${ encodeURIComponent( domain ) }?force=wpcom`,
			{ cache: 'force-cache' }
		);
		if ( siteResponse.ok ) {
			const site = await siteResponse.json();
			if ( false === site?.jetpack ) {
				return getWpcomFeedUrl( site.URL );
			}
		}

		const response = await fetch(
			`https://public-api.wordpress.com/rest/v1.1/read/feed/?url=${ encodeURIComponent( siteURL ) }`
		);
		if ( ! response.ok ) {
			return undefined;
		}

		// The Reader can return a homepage as the feed (kottke.org), so skip bare site roots.
		const { feeds } = await response.json();
		return ( feeds ?? [] )
			.map( feed => getValidFeedUrl( feed?.subscribe_URL ) )
			.find( feedUrl => {
				const url = feedUrl && new URL( feedUrl );
				return url && ( '/' !== url.pathname || url.search );
			} );
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
