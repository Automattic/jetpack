/**
 * WordPress dependencies
 */
import { share } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/** No configurable attributes; the empty record allows host-provided fields. */
export type SharesAttributes = Record< never, never >;

/**
 * Ported from the Jetpack Stats "Shares" module. Reads `shares_<service>` fields
 * from the all-time site summary, so it ignores the dashboard date range.
 */
export default {
	icon: share,
	attributes: [] as WidgetAttributeField< SharesAttributes >[],
	example: {
		attributes: {},
	},
};
