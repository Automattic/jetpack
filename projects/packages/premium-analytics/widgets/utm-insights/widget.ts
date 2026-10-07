/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { megaphone } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import type { StatsUtmParam } from '@jetpack-premium-analytics/data';
import { getUtmDimensionOptions } from '@jetpack-premium-analytics/widgets-toolkit';

/**
 * Widget attributes shape.
 *
 * @property utmDimension   - UTM dimension to break down by. Defaults to 'utm_source,utm_medium'.
 * @property showReportLink - Whether to render the footer: View all and Download CSV. Defaults to true.
 *                          Host compositions on terminal pages (post detail) set this to false;
 *                          it is not a user-facing control.
 */
export type UtmInsightsAttributes = {
	utmDimension?: StatsUtmParam;
	showReportLink?: boolean;
};

/**
 * Shows traffic breakdown by UTM parameter via `stats/utm/{utmParam}`. The
 * active dimension is `utmDimension` (`relevance: 'high'`), so the widget
 * host renders its control.
 */
export default {
	icon: megaphone,
	attributes: [
		{
			id: 'utmDimension',
			label: __( 'UTM parameter', 'jetpack-premium-analytics-pkg' ),
			type: 'jpa/select',
			elements: getUtmDimensionOptions(),
			relevance: 'high',
		},
	] as WidgetAttributeField< UtmInsightsAttributes >[],
	example: {
		attributes: {
			utmDimension: 'utm_source,utm_medium',
		},
	},
};
