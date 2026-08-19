/**
 * WordPress dependencies
 */
import { mobile } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/** No configurable attributes; the empty record allows host-provided fields. */
export type DevicesAttributes = Record< never, never >;

/**
 * Devices widget type definition.
 *
 * Shows screen size breakdown (Desktop / Mobile / Tablet) via the PA proxy
 * at `stats/devices/screensize`. Date range comes from WidgetRoot's
 * reportParams (the shared dashboard date picker).
 */
export default {
	icon: mobile,
	attributes: [] as WidgetAttributeField< DevicesAttributes >[],
	example: {
		attributes: {},
	},
};
