/**
 * WordPress dependencies
 */
import { category } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/** No configurable attributes; the empty record allows host-provided fields. */
export type TagsAttributes = Record< never, never >;

/**
 * Ported from the Jetpack Stats "Tags & categories" module: most-visited tags
 * and categories, ranked by views. Grouped rows (multiple tags on one post)
 * have no single archive URL and drill down to their members instead.
 */
export default {
	icon: category,
	attributes: [] as WidgetAttributeField< TagsAttributes >[],
	example: {
		attributes: {},
	},
};
