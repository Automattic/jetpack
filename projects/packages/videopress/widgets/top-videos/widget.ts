/**
 * WordPress dependencies
 */
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/** No configurable attributes; the empty record allows host-provided fields. */
export type TopVideosAttributes = Record< never, never >;

export default {
	attributes: [] as WidgetAttributeField< TopVideosAttributes >[],
	example: {
		attributes: {},
	},
};
