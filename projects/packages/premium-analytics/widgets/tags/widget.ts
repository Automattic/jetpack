/**
 * WordPress dependencies
 */
import { category } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * The Tags & categories widget has no configurable attributes: it requests
 * the shared `WIDGET_ROW_LIMIT` rows and renders as many of them as its tile
 * fits.
 *
 * `Record< never, never >` (not `Record< string, never >`) so the render-only
 * type can compose host fields such as `reportParams` without collapsing them
 * to `never`.
 */
export type TagsAttributes = Record< never, never >;

/**
 * Widget type definition for the Tags & categories widget.
 *
 * Ported from the Jetpack Stats "Tags & categories" module. Lists the site's
 * most visited tags and categories for the selected period, ranked by views.
 *
 * Data: read from the `stats/tags` endpoint via `useStatsTags`. A row can group
 * several tags/categories that share a post; those grouped rows have no single
 * archive URL and drill down to their individual members instead.
 */
export default {
	icon: category,
	attributes: [] as WidgetAttributeField< TagsAttributes >[],
	example: {
		attributes: {},
	},
};
