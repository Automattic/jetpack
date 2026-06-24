/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { desktop } from '@wordpress/icons';

/**
 * Widget attributes shape.
 *
 * @property max            - Maximum rows to display (0 = all). Defaults to 5.
 * @property deviceProperty - Which device dimension to break down by.
 */
export type DevicesAttributes = {
	max?: number;
	deviceProperty?: 'screensize' | 'browser';
};

/**
 * Locations (by device) widget type definition.
 *
 * Data: fetched via the PA proxy at `stats/devices/{deviceProperty}`.
 * Date range comes from WidgetRoot's reportParams (the shared dashboard date
 * picker).
 *
 * Known limitations: delta/comparison rows all show 0 (follow-up).
 */
export default {
	name: 'jpa/devices',
	title: __( 'Devices', 'jetpack-premium-analytics' ),
	icon: desktop,
	attributes: [
		{
			id: 'deviceProperty',
			label: __( 'View by', 'jetpack-premium-analytics' ),
			type: 'select',
			options: [
				{ label: __( 'Screen size', 'jetpack-premium-analytics' ), value: 'screensize' },
				{ label: __( 'Browser', 'jetpack-premium-analytics' ), value: 'browser' },
			],
		},
		{
			id: 'max',
			label: __( 'Max rows', 'jetpack-premium-analytics' ),
			type: 'number',
		},
	],
	example: {
		attributes: {
			deviceProperty: 'screensize',
			max: 5,
		},
	},
};
