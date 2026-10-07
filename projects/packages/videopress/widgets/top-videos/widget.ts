/**
 * WordPress dependencies
 */
import { video } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/** No configurable attributes; the empty record allows host-provided fields. */
export type TopVideosAttributes = Record< never, never >;

export default {
	icon: video,
	attributes: [] as WidgetAttributeField< TopVideosAttributes >[],
	example: {
		attributes: {},
	},
};
