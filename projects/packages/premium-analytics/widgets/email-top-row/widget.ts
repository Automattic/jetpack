/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { envelope } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

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
	 * open rate) or the Clicks view (opens, clicks, click rate). Defaults to `opens`.
	 */
	metric?: EmailMetric;
};

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats "Email top row" module (the header row on an
 * individual email's stats detail page). Shows one email's all-time headline
 * counts as a row of metric tiles, switching between the Opens and Clicks views
 * with the `metric` attribute (`relevance: 'high'`, so the host renders the
 * control). Data comes from the per-post `stats/<opens|clicks>/emails/<postId>/rate`
 * breakdown, which is all-time and returns no comparison rows, so the widget
 * ignores the dashboard date range and never shows period-over-period deltas.
 */
export default {
	name: 'jpa/email-top-row',
	title: __( 'Email top row', 'jetpack-premium-analytics' ),
	icon: envelope,
	help: {
		content: __(
			'Headline stats for a single email. The Opens view shows total sends, unique opens, total opens, and open rate; the Clicks view shows total opens, total clicks, and click rate. Rates are measured against total sends. Figures are all-time and are not affected by the dashboard date range.',
			'jetpack-premium-analytics'
		),
	},
	attributes: [
		{
			id: 'metric',
			label: __( 'View by', 'jetpack-premium-analytics' ),
			type: 'text',
			elements: [
				{
					label: __( 'Opens', 'jetpack-premium-analytics' ),
					value: 'opens',
				},
				{
					label: __( 'Clicks', 'jetpack-premium-analytics' ),
					value: 'clicks',
				},
			],
			relevance: 'high',
		},
	] as WidgetAttributeField< EmailTopRowAttributes >[],
	example: {
		attributes: {
			metric: 'opens',
		},
	},
};
