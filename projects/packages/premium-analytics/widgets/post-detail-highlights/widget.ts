/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { starEmpty } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * The Post highlights widget has no configurable attributes: it always shows
 * the three highlight metrics of the post the page is scoped to (via
 * `reportParams.post_id`). `Record< never, never >` (not
 * `Record< string, never >`) so the render-only type can compose host fields
 * such as `reportParams` without collapsing them to `never`.
 */
export type PostDetailHighlightsAttributes = Record< never, never >;

/**
 * Widget type definition.
 *
 * The post detail Traffic view's highlights card: the scoped post's views,
 * comments, and likes as metric tiles. Views is period-scoped to the
 * dashboard date range (with a period-over-period delta when comparison is
 * on); comments and likes are lifetime totals — the API has no per-post
 * history for them, so their tiles carry a note instead of a delta. The
 * post's title, date, and featured image are owned by the detail page's
 * summary header, not repeated here.
 */
export default {
	name: 'jpa/post-detail-highlights',
	title: __( 'Post highlights', 'jetpack-premium-analytics' ),
	help: {
		content: __(
			'Views, comments, and likes for the post or page being viewed.',
			'jetpack-premium-analytics'
		),
	},
	icon: starEmpty,
	attributes: [] as WidgetAttributeField< PostDetailHighlightsAttributes >[],
	example: {
		attributes: {},
	},
};
