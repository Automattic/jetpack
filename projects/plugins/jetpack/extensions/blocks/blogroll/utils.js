import { createBlock } from '@wordpress/blocks';
import PlaceholderSiteIcon from './placeholder-site-icon.svg';

export function createBlockFromRecommendation( attrs ) {
	let trimmedURL;
	try {
		trimmedURL = new URL( attrs?.url )?.host.replace( /^www\./, '' );
	} catch ( e ) {
		trimmedURL = attrs?.URL;
	}

	return createBlock( 'jetpack/blogroll-item', {
		...attrs,
		...( ! attrs.name && { name: trimmedURL } ),
	} );
}

export function createBlockFromSubscription( subscription ) {
	const { blog_id, site_icon, URL, name, description, is_non_wpcom_site } = subscription;

	return createBlockFromRecommendation( {
		id: blog_id,
		icon: site_icon,
		url: URL,
		name,
		description,
		is_non_wpcom_site,
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
	} catch ( e ) {
		return siteURL.match( pattern )?.[ 2 ] ?? null;
	}
}

export function getSiteIcon( siteIconURL ) {
	if ( ! siteIconURL ) {
		return PlaceholderSiteIcon;
	}
	return siteIconURL;
}
