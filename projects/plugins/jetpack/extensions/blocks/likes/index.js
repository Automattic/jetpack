/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import LikesCheckbox from './likes-checkbox';
import { DonationsIcon } from '../../shared/icons';
import edit from './edit';

export const name = 'likes';

export const pluginSettings = { render: LikesCheckbox };

export const blockSettings = {
	title: __( 'Likes', 'jetpack' ),
	description: __( 'Display a like button on the post.', 'jetpack' ),
	icon: DonationsIcon,
	category: 'embed',
	keywords: [
		_x( 'like', 'block search term', 'jetpack' ),
		_x( 'likes', 'block search term', 'jetpack' ),
	],
	supports: {
		align: false,
		html: false,
	},
	attributes: {},
	edit,
	save: () => null,
};
