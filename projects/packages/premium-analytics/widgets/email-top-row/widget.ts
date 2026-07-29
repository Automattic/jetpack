/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { envelope } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { SelectField } from '@jetpack-premium-analytics/fields';

/**
 * Which set of headline metrics the top row shows for the selected email —
 * mirrors the Opens and Clicks internal tabs on the Jetpack Stats email detail
 * page. Each view is backed by its own all-time `stats/<opens|clicks>/emails/<postId>/rate`
 * breakdown, so the tiles and the data source switch together.
 *
 * Same name and value set as `EmailMetric` in the sibling `emails` widget
 * (`widgets/emails/widget.ts`) — the email detail page host drives both widgets
 * from one tab state, so the attribute must stay aligned. Mirrored locally
 * because widgets are separate workspace packages and cannot import each other.
 */
export type EmailMetric = 'opens' | 'clicks';

/**
 * Configurable attributes for the "Email top row" widget.
 *
 * The widget shows one metric view (`metric`) of a single email. The email is
 * scoped by the host through `reportParams.post_id` (the shared single-resource
 * "detail page" param), not by an attribute — the email detail page seeds
 * `post_id` from its route so every widget on the page shares one scope. Only
 * the Opens/Clicks view is a per-widget setting, supplied via the active tab.
 * The underlying rate endpoints are per-post and always all-time, so the
 * dashboard date range is ignored.
 */
export type EmailTopRowAttributes = {
	/**
	 * Which headline metrics to show: the Opens view (sends, unique opens, opens,
	 * open rate) or the Clicks view (sends, unique opens, clicks, click rate).
	 * Defaults to `opens`.
	 */
	metric?: EmailMetric;
};

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats "Email top row" module (the header row on an
 * individual email's stats detail page). Shows one email's all-time headline
 * counts as a row of metric tiles, switching between the Opens and Clicks views
 * with the `metric` attribute. The attribute stays at the default (low)
 * relevance: the post detail page splits the views into their own tabs, so a
 * header control would duplicate the tab switch.
 * Data comes from the per-post `stats/<opens|clicks>/emails/<postId>/rate`
 * breakdown, which is all-time and returns no comparison rows, so the widget
 * ignores the dashboard date range and never shows period-over-period deltas.
 */
export default {
	icon: envelope,
	attributes: [
		{
			id: 'metric',
			label: __( 'View by', 'jetpack-premium-analytics-pkg' ),
			type: 'text',
			Edit: SelectField,
			elements: [
				{
					label: __( 'Opens', 'jetpack-premium-analytics-pkg' ),
					value: 'opens',
				},
				{
					label: __( 'Clicks', 'jetpack-premium-analytics-pkg' ),
					value: 'clicks',
				},
			],
		},
	] as WidgetAttributeField< EmailTopRowAttributes >[],
	example: {
		attributes: {
			metric: 'opens',
		},
	},
};
