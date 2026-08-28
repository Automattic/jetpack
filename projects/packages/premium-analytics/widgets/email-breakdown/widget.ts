/**
 * WordPress dependencies
 */
import { envelope } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Which breakdown dimension the widget lists for the selected email.
 *
 * `countries`, `devices`, and `clients` read the opens or clicks breakdown per
 * the `metric` attribute; `links` always reads the *clicks* breakdown (only
 * clicked links exist). See `use-email-breakdown-rows.ts`.
 */
export type EmailBreakdownView = 'countries' | 'devices' | 'clients' | 'links';

/**
 * Which email metric the dimension views break down, matching the Opens/Clicks
 * tabs of the Calypso email detail page. Ignored by the `links` view.
 */
export type EmailBreakdownMetric = 'opens' | 'clicks';

/**
 * Attributes for the Email breakdown widget. None is user-editable (the widget
 * definition below declares no `attributes`); the host pins them per card in
 * its layout and passes the values through to `render.tsx`.
 */
export type EmailBreakdownAttributes = {
	/**
	 * Which breakdown dimension to display. Defaults to `countries`.
	 */
	view?: EmailBreakdownView;
	/**
	 * Whether the dimension views show opens or clicks. Defaults to `opens`.
	 */
	metric?: EmailBreakdownMetric;
	/**
	 * Whether the countries view also renders a world map. Used by the wide
	 * Location clicks card in the fixed post-detail composition.
	 */
	showMap?: boolean;
};

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats email detail "breakdown" modules
 * (`stats-email-module`). That family is one module rendered four times — by
 * country, device, email client, and clicked link — so this ships as a single
 * widget with a `view` attribute instead of four near-identical widgets. The
 * attributes are not user-editable: the post detail page pins each view as its
 * own fixed, page-titled card with `view` and `metric` set in its layout, so
 * exposing them (inline or in the settings drawer) would let a "Location opens"
 * card show links or clicks. With no editable attribute, the host renders no
 * settings affordance. The breakdown is scoped to a single email by the host
 * through `reportParams.post_id` (the shared single-resource "detail page"
 * param), not by an attribute; the endpoints report over the whole lifetime of
 * the email, so there is no date range or comparison period.
 */
export default {
	icon: envelope,
	attributes: [] as WidgetAttributeField< EmailBreakdownAttributes >[],
	example: {
		attributes: {
			view: 'countries',
			metric: 'opens',
		},
	},
};
