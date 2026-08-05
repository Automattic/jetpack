/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { desktop } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Widget attributes shape.
 */
export type DevicesAttributes = {
	/**
	 * Maximum rows to display (0 = all). Defaults to 5.
	 */
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
	icon: desktop,
	attributes: [
		{
			id: 'max',
			label: __( 'Number of results', 'jetpack-premium-analytics-pkg' ),
			type: 'integer',
		},
	] as WidgetAttributeField< DevicesAttributes >[],
	example: {
		attributes: {
			max: 5,
		},
	},
};
