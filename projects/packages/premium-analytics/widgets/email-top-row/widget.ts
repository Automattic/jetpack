/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { envelope } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Configurable attributes for the "Email top row" widget.
 *
 * The widget is scoped to a single email by `postId`. The dashboard supplies
 * the selected email's post ID through this attribute; there is no report-param
 * (`post_id`) scoping because the underlying `stats/emails/summary` endpoint has
 * no per-post filter and is always all-time, so the widget selects the matching
 * row client-side from the latest emails.
 */
export type EmailTopRowAttributes = {
	/**
	 * Post ID of the email whose totals to display. When absent or not present in
	 * the latest emails summary, the widget shows its empty state.
	 */
	postId?: number;
};

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats "Email top row" module (the header row on an
 * individual email's stats detail page). Shows the email's all-time headline
 * counts — total sends, total opens, unique opens, and total clicks — plus the
 * open and click rates, as a row of metric tiles.
 *
 * The `stats/emails/summary` endpoint is all-time and site-wide, so the widget
 * ignores the dashboard date range and comparison period; the endpoint returns
 * no comparison rows, so no period-over-period deltas are shown.
 */
export default {
	name: 'jpa/email-top-row',
	title: __( 'Email top row', 'jetpack-premium-analytics' ),
	icon: envelope,
	attributes: [
		{
			id: 'postId',
			label: __( 'Email ID', 'jetpack-premium-analytics' ),
			type: 'integer',
		},
	] as WidgetAttributeField< EmailTopRowAttributes >[],
	example: {
		attributes: {
			postId: 2000,
		},
	},
};
