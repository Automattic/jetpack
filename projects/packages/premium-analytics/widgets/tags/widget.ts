/**
 * WordPress dependencies
 */
import { category } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/** No configurable attributes; the empty record allows host-provided fields. */
export type TagsAttributes = Record< never, never >;

/**
 * Widget type definition for the Tags & categories widget.
 *
 * Ported from the Jetpack Stats "Tags & categories" module. Lists the site's
 * most visited tags and categories over the last 7 days, ranked by views.
 *
 * Data: read from the `stats/tags` endpoint via `useStatsTags`. The endpoint
 * hardcodes a 7-day window and accepts no date parameters, so the widget cannot
 * follow the dashboard date range and labels its own period instead. A row can
 * group several tags/categories that share a post; those grouped rows have no
 * single archive URL and drill down to their individual members instead.
 */
export default {
	icon: category,
	attributes: [] as WidgetAttributeField< TagsAttributes >[],
	example: {
		attributes: {},
	},
};
