/**
 * WordPress dependencies
 */
import { comment } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/** No configurable attributes; the empty record allows host-provided fields. */
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
