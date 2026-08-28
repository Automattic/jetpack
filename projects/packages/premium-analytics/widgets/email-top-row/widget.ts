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
 * Attributes for the "Email top row" widget. None is user-editable (the widget
 * definition below declares no `attributes`); the host pins them in its layout.
 *
 * The widget shows one metric view (`metric`) of a single email. The email is
 * scoped by the host through `reportParams.post_id` (the shared single-resource
 * "detail page" param), not by an attribute — the email detail page seeds
 * `post_id` from its route so every widget on the page shares one scope. Only
 * the Opens/Clicks view varies per widget, pinned by the active tab's layout.
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
 * with the `metric` attribute. The attribute is not user-editable: the post
 * detail page splits the views into their own tabs and pins `metric` per tab
 * in its layout, so exposing it (inline or in the settings drawer) would let
 * the Opens tab show clicks data. With no editable attribute, the host renders
 * no settings affordance.
 * Data comes from the per-post `stats/<opens|clicks>/emails/<postId>/rate`
 * breakdown, which is all-time and returns no comparison rows, so the widget
 * ignores the dashboard date range and never shows period-over-period deltas.
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
