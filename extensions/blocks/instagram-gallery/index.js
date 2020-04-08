/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import attributes from './attributes';
import edit from './edit';
import { getIconColor } from '../../shared/block-icons';

export const name = 'instagram-gallery';
export const iconColor = getIconColor();

export const settings = {
	title: __( 'Instagram Gallery', 'jetpack' ),
	description: __( 'Embed posts from your Instagram account', 'jetpack' ),
	icon: {
		src: 'instagram',
		foreground: iconColor,
	},
	category: 'jetpack',
	keywords: [
		_x( 'images', 'block search term', 'jetpack' ),
		_x( 'photos', 'block search term', 'jetpack' ),
		_x( 'pictures', 'block search term', 'jetpack' ),
	],
	supports: {
		align: [ 'wide', 'full' ],
		html: false,
	},
	attributes,
	edit,
	save: () => {},
};
