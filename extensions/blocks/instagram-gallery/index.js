/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import attributes from './attributes';
import edit from './edit';

export const name = 'instagram-gallery';

export const settings = {
	title: __( 'Instagram Gallery', 'jetpack' ),
	description: __( 'Embed posts from your Instagram account.', 'jetpack' ),
	icon: 'instagram',
	category: 'jetpack',
	keywords: [
		_x( 'images', 'block search term', 'jetpack' ),
		_x( 'photos', 'block search term', 'jetpack' ),
		_x( 'pictures', 'block search term', 'jetpack' ),
	],
	supports: {
		align: true,
		html: false,
	},
	attributes,
	edit,
	save: ( { attributes: { instagramUser } } ) => (
		<div>
			<a
				href={ `https://www.instagram.com/${ instagramUser }/` }
				rel="noopener noreferrer"
				target="_blank"
			>{ `https://www.instagram.com/${ instagramUser }/` }</a>
		</div>
	),
};
