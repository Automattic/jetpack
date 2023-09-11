import { __, _x } from '@wordpress/i18n';
import { getIconColor } from '../../shared/block-icons';
import attributes from './attributes';
import edit from './edit';
import Icon from './icon';

export const name = 'tock';
export const title = __( 'Tock', 'jetpack' );
export const settings = {
	apiVersion: 2,
	title,
	description: __( 'Allow visitors to reserve a table at your restaurant with Tock.', 'jetpack' ),
	icon: {
		src: Icon,
		foreground: getIconColor(),
	},
	category: 'earn',
	keywords: [
		_x( 'booking', 'block search term', 'jetpack' ),
		_x( 'reservation', 'block search term', 'jetpack' ),
		_x( 'restaurant', 'block search term', 'jetpack' ),
	],
	supports: {
		align: true,
		html: false,
		// The tock widget code only renders the same widget in each container, so you wouldn't be able to have two
		// widgets for different restaurants on the same page. We could make it that they all share the same URL.
		multiple: false,
	},
	edit,
	save: () => (
		<div
			id="Tock_widget_container"
			data-tock-display-mode="Button"
			data-tock-color-mode="Blue"
			data-tock-locale="en-us"
			data-tock-timezone="America/New_York"
		></div>
	),
	attributes,
	example: {
		attributes: {
			url: 'roister',
		},
		viewportWidth: 250,
	},
};
