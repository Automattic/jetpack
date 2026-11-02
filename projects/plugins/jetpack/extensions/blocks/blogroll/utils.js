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
	const { blog_id, site_icon, URL, name, description, is_non_wpcom_site, feed_URL } = subscription;

	return createBlockFromRecommendation( {
		id: blog_id,
		icon: site_icon,
		url: URL,
		name,
		description,
		is_non_wpcom_site,
		feed_url: feed_URL || ( is_non_wpcom_site ? undefined : getWpcomFeedUrl( URL ) ),
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
 * Only safe for a site wpcom confirmed it hosts; anywhere else the feed has to be discovered
 * or entered by hand, and a guess would be worse than no feed URL at all.
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

export function getSiteIcon( siteIconURL ) {
	if ( ! siteIconURL ) {
		return PlaceholderSiteIcon;
	}
	return siteIconURL;
}
