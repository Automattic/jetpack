/**
 * WordPress dependencies
 */
import { comment } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * The Top commented posts widget has no configurable attributes: it requests
 * the shared `WIDGET_ROW_LIMIT` rows and renders as many of them as its tile
 * fits.
 *
 * `Record< never, never >` (not `Record< string, never >`) so the render-only
 * type can compose host fields such as `reportParams` without collapsing them
 * to `never`.
 */
export type MostCommentedPostsAttributes = Record< never, never >;

/**
 * Widget type definition for the Top commented posts widget.
 *
 * One half of the Jetpack Stats "Comments" module: the posts and pages that
 * receive the most comments. The other half ships as
 * `jpa/most-commented-authors`.
 *
 * Data: fetched via the PA proxy at `stats/comments` through
 * `useStatsCommentsRows`. The endpoint is all-time and has no comparison
 * period, so the widget ignores the dashboard date range.
 */
export default {
	icon: comment,
	attributes: [] as WidgetAttributeField< MostCommentedPostsAttributes >[],
	example: {
		attributes: {},
	},
};
