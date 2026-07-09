/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { starEmpty } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * The Post highlights widget has no configurable attributes: it always shows
 * the all-time totals of the post the page is scoped to (via
 * `reportParams.post_id`). `Record< never, never >` (not
 * `Record< string, never >`) so the render-only type can compose host fields
 * such as `reportParams` without collapsing them to `never`.
 */
export type PostDetailHighlightsAttributes = Record< never, never >;

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats post detail "Highlights" section (the
 * "All-time stats" card). Shows the scoped post's lifetime views, likes, and
 * comments. The post scope comes from the post detail page's
 * `reportParams.post_id`; the metrics are lifetime totals, so there is no
 * date range or comparison period. The post's title, date, and featured image
 * are owned by the detail page's summary header, not repeated here.
 */
export default {
	name: 'jpa/post-detail-highlights',
	title: __( 'Post highlights', 'jetpack-premium-analytics' ),
	icon: starEmpty,
	attributes: [] as WidgetAttributeField< PostDetailHighlightsAttributes >[],
	example: {
		attributes: {},
	},
};
