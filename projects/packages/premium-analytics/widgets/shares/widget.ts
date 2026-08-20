/**
 * WordPress dependencies
 */
import { share } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/** No configurable attributes; the empty record allows host-provided fields. */
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
