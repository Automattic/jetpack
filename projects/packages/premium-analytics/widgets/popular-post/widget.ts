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
 * dashboard's selected date range. The range only picks the winner — the views,
 * likes, and comments shown for it are all-time totals.
 */
export default {
	icon: trendingUp,
	attributes: [] as WidgetAttributeField< PopularPostAttributes >[],
	example: {
		attributes: {},
	},
};
