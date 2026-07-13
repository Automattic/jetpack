/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { calendar } from '@wordpress/icons';

/**
 * The Posting activity widget has no configurable settings: it always renders
 * posting activity for the trailing year ending at the selected end date.
 */
export type PostingActivityAttributes = Record< never, never >;

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats "Posting activity" module. Renders a calendar
 * (contribution-style) heatmap of the number of posts published per day. The
 * end date comes from the dashboard picker via WidgetRoot's reportParams; the
 * `stats/streak` endpoint has no comparison period, so no delta is shown.
 */
export default {
	name: 'jpa/posting-activity',
	title: __( 'Posting activity', 'jetpack-premium-analytics' ),
	icon: calendar,
};
