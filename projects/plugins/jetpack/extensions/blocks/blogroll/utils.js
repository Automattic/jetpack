import { createBlock } from '@wordpress/blocks';

export function createBlockFromSubscription( subscription ) {
	const { blog_id, site_icon, URL, name, description } = subscription;

	return createBlock( 'jetpack/blogroll-item', {
		id: blog_id,
		icon: site_icon,
		url: URL,
		name,
		description,
	} );
}
