/**
 * WordPress dependencies
 */
import { mobile } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/** No configurable attributes; the empty record allows host-provided fields. */
export type DevicesAttributes = Record< never, never >;

/**
 * Screen size breakdown, from the PA proxy at `stats/devices/screensize`.
 */
export default {
	icon: mobile,
	attributes: [] as WidgetAttributeField< DevicesAttributes >[],
	example: {
		attributes: {},
	},
};
