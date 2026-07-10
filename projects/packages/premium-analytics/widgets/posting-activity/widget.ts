/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { calendar } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { PostingActivityWindowControl } from './navigation-control';

/**
 * Configurable attributes for the Posting activity widget.
 */
export type PostingActivityAttributes = {
	/**
	 * Page offset within the trailing-year activity window. 0 is the latest page;
	 * positive values page backward, negative values wrap forward.
	 */
	activityWindowOffset?: number;
};

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats "Posting activity" module. Renders a calendar
 * (contribution-style) heatmap of the number of posts published per day across
 * the trailing year ending at the dashboard picker end date. Narrower windows
 * page through that year via `activityWindowOffset`; the `stats/streak`
 * endpoint has no comparison period, so no delta is shown.
 */
export default {
	name: 'jpa/posting-activity',
	title: __( 'Posting activity', 'jetpack-premium-analytics' ),
	icon: calendar,
	attributes: [
		{
			id: 'activityWindowOffset',
			label: __( 'Activity window', 'jetpack-premium-analytics' ),
			type: 'integer',
			Edit: PostingActivityWindowControl,
			relevance: 'high',
		},
	] as WidgetAttributeField< PostingActivityAttributes >[],
	example: {
		attributes: {
			activityWindowOffset: 0,
		},
	},
};
