/**
 * WordPress dependencies
 */
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
 * Attributes for the "Email top row" widget. The email itself is scoped by the
 * host through `reportParams.post_id` (the shared single-resource "detail page"
 * param), not by an attribute; the rate endpoints are all-time, so the dashboard
 * date range is ignored.
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
 * Ported from the Jetpack Stats "Email top row" module (the header row on an
 * email's stats detail page). No attribute field is declared: the post detail
 * page splits Opens/Clicks into tabs and pins `metric` per tab, so exposing it
 * would let the Opens tab show clicks data. The rate breakdown returns no
 * comparison rows, so there are never period-over-period deltas.
 */
export default {
	icon: envelope,
	attributes: [] as WidgetAttributeField< EmailTopRowAttributes >[],
	example: {
		attributes: {
			metric: 'opens',
		},
	},
};
