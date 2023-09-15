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

export function checkIfValidDomain( siteURL ) {
	const regEx =
		/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,64}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/g;

	if ( ! siteURL ) {
		return false;
	}

	let validUrl;

	try {
		validUrl = new URL( siteURL );
	} catch ( e ) {
		validUrl = siteURL.match( regEx );
	}

	return validUrl ? true : false;
}

export function getSiteIcon( siteIconURL ) {
	if ( ! siteIconURL ) {
		return 'https://s0.wp.com/i/webclip.png';
	}
	return siteIconURL;
}
