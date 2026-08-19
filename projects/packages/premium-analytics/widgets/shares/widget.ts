/**
 * WordPress dependencies
 */
import { share } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * The Shares widget has no configurable attributes: it requests
 * the shared `WIDGET_ROW_LIMIT` rows and renders as many of them as its tile
 * fits.
 *
 * `Record< never, never >` (not `Record< string, never >`) so the render-only
 * type can compose host fields such as `reportParams` without collapsing them
 * to `never`.
 */
export type SharesAttributes = Record< never, never >;

/**
 * Widget type definition for the Shares widget.
 *
 * Ported from the Jetpack Stats "Shares" module. Lists each social network your
 * content was shared to, ranked by the number of shares.
 *
 * Data: read from the site summary (`stats` endpoint) via `useStatsSite`; the
 * `shares_<service>` fields hold the per-network counts. The summary is all-time
 * and has no comparison period, so the widget ignores the dashboard date range.
 */
export default {
	icon: share,
	attributes: [] as WidgetAttributeField< SharesAttributes >[],
	example: {
		attributes: {},
	},
};
