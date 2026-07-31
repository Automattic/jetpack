/**
 * WordPress dependencies
 */
import { video } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Video highlights has no configurable attributes. The detail page scopes it
 * to one video through `reportParams.post_id`.
 */
export type VideoDetailHighlightsAttributes = Record< never, never >;

/**
 * Widget type definition for the selected video's range-scoped metrics.
 */
export default {
	icon: video,
	attributes: [] as WidgetAttributeField< VideoDetailHighlightsAttributes >[],
	example: {
		attributes: {},
	},
};
