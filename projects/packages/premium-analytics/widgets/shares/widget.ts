/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { share } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

export type SharesAttributes = {
	/**
	 * Maximum number of rows to display.
	 */
	max?: number;
};

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
	name: 'jpa/shares',
	title: __( 'Shares', 'jetpack-premium-analytics' ),
	help: {
		content: __(
			'Learn where your content has been shared the most.',
			'jetpack-premium-analytics'
		),
	},
	icon: share,
	attributes: [
		{
			id: 'max',
			label: __( 'Number of results', 'jetpack-premium-analytics' ),
			type: 'integer',
		},
	] as WidgetAttributeField< SharesAttributes >[],
	example: {
		attributes: {
			max: 10,
		},
	},
};
