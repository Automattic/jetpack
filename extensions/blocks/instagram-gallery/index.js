/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import attributes from './attributes';
import edit from './edit';
import './store';
import { supportsCollections } from '../../shared/block-category';

export const name = 'instagram-gallery';

export const settings = {
	title: __( 'Latest Instagram Posts', 'jetpack' ),
	description: __(
		'Display an automatically updating list of the latest posts from your Instagram feed.',
		'jetpack'
	),
	icon: 'instagram',
	category: supportsCollections() ? 'embed' : 'jetpack',
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
