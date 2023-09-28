import { __ } from '@wordpress/i18n';
import { getIconColor } from '../../shared/block-icons';
import attributes from './attributes';
import edit from './edit';
import icon from './icon';
import save from './save';

export const name = 'goodreads';
export const title = __( 'Goodreads', 'jetpack' );
export const settings = {
	title,
	description: __( 'Features books from the shelves of your Goodreads account.', 'jetpack' ),
	icon: {
		src: icon,
		foreground: getIconColor(),
	},
	category: 'embed',
	keywords: [],
	supports: {
		align: true,
		html: false,
	},
	edit,
	save,
	attributes,
	example: {
		attributes: {
			bookNumber: 2,
			goodreadsId: 1176283,
			style: 'default',
		},
	},
};
