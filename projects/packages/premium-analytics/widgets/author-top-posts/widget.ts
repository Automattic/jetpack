/**
 * WordPress dependencies
 */
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * No configurable attributes. `Record< never, never >` so the render-only type
 * can compose host fields such as `reportParams` without collapsing to `never`.
 */
export type AuthorTopPostsAttributes = Record< never, never >;

export default {
	attributes: [] as WidgetAttributeField< AuthorTopPostsAttributes >[],
	example: {
		attributes: {},
	},
};
