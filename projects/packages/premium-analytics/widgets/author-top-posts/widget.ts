/**
 * WordPress dependencies
 */
import { postList } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * No configurable attributes. `Record< never, never >` so the render-only type
 * can compose host fields such as `reportParams` without collapsing to `never`.
 */
export type AuthorTopPostsAttributes = Record< never, never >;

export default {
	icon: postList,
	attributes: [] as WidgetAttributeField< AuthorTopPostsAttributes >[],
	example: {
		attributes: {},
	},
};
