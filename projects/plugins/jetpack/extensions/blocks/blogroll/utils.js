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
