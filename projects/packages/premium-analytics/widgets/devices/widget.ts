/**
 * WordPress dependencies
 */
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/** No configurable attributes; the empty record allows host-provided fields. */
export type DevicesAttributes = Record< never, never >;

/**
 * Screen size breakdown, from the PA proxy at `stats/devices/screensize`.
 */
export default {
	attributes: [] as WidgetAttributeField< DevicesAttributes >[],
	example: {
		attributes: {},
	},
};
