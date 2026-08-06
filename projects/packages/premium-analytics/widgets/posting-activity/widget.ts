/**
 * WordPress dependencies
 */
import { calendar } from '@wordpress/icons';

/**
 * The Posting activity widget has no configurable settings: it always renders
 * the full calendar heatmap for the dashboard's selected date range.
 */
export type PostingActivityAttributes = Record< never, never >;

/**
 * Ported from the Jetpack Stats "Posting activity" module. Renders a calendar
 * (contribution-style) heatmap of the number of posts published per day. The
 * date range comes from the dashboard picker via WidgetRoot's reportParams; the
 * `stats/streak` endpoint has no comparison period, so no delta is shown.
 */
export default {
	icon: calendar,
};
