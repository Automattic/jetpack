/**
 * WordPress dependencies
 */
import { trendingUp } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * The Popular post widget has no configurable attributes: it always shows the
 * single most-viewed post for the dashboard's date range. `Record< never, never >`
 * (not `Record< string, never >`) so the render-only type can compose host fields
 * such as `reportParams` without collapsing them to `never`.
 */
export type PopularPostAttributes = Record< never, never >;

/**
 * Widget type definition.
 *
 * The Insights "Most popular post" module: the site's most-viewed post for the
 * dashboard's selected date range. Unlike the sibling Latest post widget, this
 * one is period-scoped — changing the date range changes which post wins and the
 * view count shown for it.
 */
export default {
	icon: trendingUp,
	attributes: [] as WidgetAttributeField< PopularPostAttributes >[],
	example: {
		attributes: {},
	},
};
