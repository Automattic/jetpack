import { __, _x } from '@wordpress/i18n';
import { getIconColor } from '../../shared/block-icons';
import attributes from './attributes';
import edit from './edit';
import icon from './icon';
import save from './save';

/**
 * Style dependencies
 */
import './editor.scss';

export const name = 'tock';
export const title = __( 'Tock', 'jetpack' );
export const innerButtonBlock = {
	name: 'jetpack/button',
	attributes: {
		element: 'div',
		text: _x( 'Book now', 'verb: e.g. book a table.', 'jetpack' ),
		uniqueId: 'Tock_widget_container',
		passthroughAttributes: {
			'data-tock-display-mode': 'Button',
			'data-tock-color-mode': 'Blue',
			'data-tock-locale': 'en-US',
			'data-tock-timezone': 'America/Chicago',
		},
	},
};
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
		multiple: false,
		reusable: true,
	},
	edit,
	/* @TODO Write the block editor output */
	save,
	attributes,
	example: {
		attributes: {
			tockName: 'roister',
		},
		innerBlocks: [ innerButtonBlock ],
	},
};
