/**
 * WordPress dependencies
 */
import { comment } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/** No configurable attributes; the empty record allows host-provided fields. */
export type MostCommentedPostsAttributes = Record< never, never >;

/**
 * One half of the Jetpack Stats "Comments" module; the other ships as
 * `jpa/most-commented-authors`. `stats/comments` is all-time with no comparison
 * period, so the widget ignores the dashboard date range.
 */
export default {
	icon: comment,
	attributes: [] as WidgetAttributeField< MostCommentedPostsAttributes >[],
	example: {
		attributes: {},
	},
};
