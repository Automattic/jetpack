/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { video } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Video highlights has no configurable attributes. The detail page scopes it
 * to one video through `reportParams.post_id`.
 */
export type VideoDetailHighlightsAttributes = Record< never, never >;

/**
 * Widget type definition for the selected video's complete Stats metrics.
 */
export default {
	name: 'jpa/video-detail-highlights',
	title: __( 'Video highlights', 'jetpack-premium-analytics' ),
	help: {
		content: __(
			'Views, impressions, hours watched, and retention rate for the video being viewed.',
			'jetpack-premium-analytics'
		),
	},
	icon: video,
	attributes: [] as WidgetAttributeField< VideoDetailHighlightsAttributes >[],
	example: {
		attributes: {},
	},
};
