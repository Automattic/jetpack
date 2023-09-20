import { createBlock } from '@wordpress/blocks';

export function createBlockFromRecommendation( attrs ) {
	const { icon } = attrs;

	return createBlock( 'jetpack/blogroll-item', {
		...attrs,
		icon: icon || 'https://s0.wp.com/i/webclip.png',
	} );
}

export function createBlockFromSubscription( subscription ) {
	const { blog_id, site_icon, URL, name, description } = subscription;

	return createBlockFromRecommendation( {
		id: blog_id,
		icon: site_icon,
		url: URL,
		name,
		description,
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
		return 'https://s0.wp.com/i/webclip.png';
	}
	return siteIconURL;
}
