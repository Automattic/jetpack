import { __, _x } from '@wordpress/i18n';
import { getIconColor } from '../../shared/block-icons';
import edit from './edit';

export const name = 'blogroll';
export const title = __( 'Blogroll', 'jetpack' );
export const settings = {
	title,
	icon: {
		src: 'admin-links',
		foreground: getIconColor(),
	},
	category: 'text',
	keywords: [
		_x( 'blog roll', 'block search term', 'jetpack' ),
		_x( 'links', 'block search term', 'jetpack' ),
	],
	description: __(
		'The blogroll block allows you to display your links added from the link manager.',
		'jetpack'
	),
	supports: {
		align: [ 'left', 'right', 'wide', 'full' ],
		color: {
			gradients: true,
			link: true,
		},
		spacing: {
			padding: true,
			margin: true,
		},
		typography: {
			fontSize: true,
			lineHeight: true,
		},
		customClassName: true,
		className: true,
	},
	edit,
};
