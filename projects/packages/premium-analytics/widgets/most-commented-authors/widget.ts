/**
 * WordPress dependencies
 */
import { postAuthor } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/** No configurable attributes; the empty record allows host-provided fields. */
export type MostCommentedAuthorsAttributes = Record< never, never >;

/**
 * One half of the Jetpack Stats "Comments" module; the other ships as
 * `jpa/most-commented-posts`. `stats/comments` is all-time with no comparison
 * period, so the widget ignores the dashboard date range.
 */
export default {
	icon: postAuthor,
	attributes: [] as WidgetAttributeField< MostCommentedAuthorsAttributes >[],
	example: {
		attributes: {},
	},
};
