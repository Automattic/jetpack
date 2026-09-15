/**
 * WordPress dependencies
 */
import { postList } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * The Top viewed posts widget has no configurable attributes: it always ranks
 * the posts of the author the page is scoped to (via `reportParams.author_id`).
 * `Record< never, never >` so the render-only type can compose host fields such
 * as `reportParams` without collapsing them to `never`.
 */
export type AuthorTopPostsAttributes = Record< never, never >;

export default {
	icon: postList,
	attributes: [] as WidgetAttributeField< AuthorTopPostsAttributes >[],
	example: {
		attributes: {},
	},
};
