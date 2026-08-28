/**
 * WordPress dependencies
 */
import { envelope } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Which breakdown dimension the widget lists for the selected email. `links`
 * ignores the `metric` attribute and always reads the clicks breakdown, since
 * only clicked links exist.
 */
export type EmailBreakdownView = 'countries' | 'devices' | 'clients' | 'links';

/**
 * Which email metric the dimension views break down, matching the Opens/Clicks
 * tabs of the Calypso email detail page. Ignored by the `links` view.
 */
export type EmailBreakdownMetric = 'opens' | 'clicks';

/**
 * Attributes for the Email breakdown widget. None is user-editable: the post
 * detail layout pins them per card and passes the values through to `render.tsx`.
 */
export type EmailBreakdownAttributes = {
	view?: EmailBreakdownView;
	metric?: EmailBreakdownMetric;
	/** Set by the wide Location clicks card in the fixed post-detail composition. */
	showMap?: boolean;
};

/**
 * Ported from the Jetpack Stats "breakdown" modules (`stats-email-module`), one
 * module rendered four times via `view`. No attribute is declared: the post detail
 * page pins `view` and `metric` per titled card, so exposing them would let a
 * "Location opens" card show links or clicks. Endpoints are all-time (no date range).
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
