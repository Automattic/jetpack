import { createBlock } from '@wordpress/blocks';

export function createBlockFromRecommendation( attrs ) {
	const { icon } = attrs;

	return createBlock( 'jetpack/blogroll-item', {
		...attrs,
		icon: getSiteIconOrPlaceholder( icon ),
	} );
}

function getSiteIconOrPlaceholder( site_icon ) {
	if ( ! site_icon ) {
		return (
			'data:image/svg+xml;base64,' +
			btoa( '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"></svg>' )
		);
	}

	return site_icon;
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
