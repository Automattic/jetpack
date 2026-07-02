/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { desktop } from '@wordpress/icons';

/**
 * Widget attributes shape.
 *
 * @property max - Maximum rows to display (0 = all). Defaults to 5.
 */
export type DevicesAttributes = {
	max?: number;
};

/**
 * Devices widget type definition.
 *
 * Shows screen size breakdown (Desktop / Mobile / Tablet) via the PA proxy
 * at `stats/devices/screensize`. Date range comes from WidgetRoot's
 * reportParams (the shared dashboard date picker).
 */
export default {
	name: 'jpa/devices',
	title: __( 'Devices', 'jetpack-premium-analytics' ),
	icon: desktop,
	attributes: [
		{
			id: 'max',
			label: __( 'Max rows', 'jetpack-premium-analytics' ),
			type: 'number',
		},
	],
	example: {
		attributes: {
			max: 5,
		},
	},
};
