import { __, _x } from '@wordpress/i18n';
import { getIconColor } from '../../shared/block-icons';
import attributes from './attributes';
import edit from './edit';
import icon from './icon';

/**
 * Style dependencies
 */
import './editor.scss';

export const name = 'tock';
export const title = __( 'Tock', 'jetpack' );
export const settings = {
	title,
	description: __( 'Allow visitors to book a reservation with Tock', 'jetpack' ),
	icon: {
		src: icon,
		foreground: getIconColor(),
	},
	category: 'earn',
	keywords: [
		_x( 'booking', 'block search term', 'jetpack' ),
		_x( 'reservation', 'block search term', 'jetpack' ),
		_x( 'restaurant', 'block search term', 'jetpack' ),
	],
	supports: {
		align: [ 'left', 'right', 'full' ],
		customClassName: true,
		className: true,
		html: false,
		multiple: true,
		reusable: true,
	},
	edit,
	/* @TODO Write the block editor output */
	save: () => null,
	attributes,
	example: {
		attributes: {
			// @TODO: Add default values for block attributes, for generating the block preview.
		},
	},
};
