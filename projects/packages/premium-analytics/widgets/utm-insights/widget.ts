/**
 * Internal dependencies
 */
import type { StatsUtmParam } from '@jetpack-premium-analytics/data';

/**
 * Widget attributes shape.
 *
 * @property utmDimension   - UTM dimension to break down by. Defaults to 'utm_source,utm_medium'.
 * @property showReportLink - Whether to offer the View all link and the CSV download. Defaults to true.
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
	example: {
		attributes: {
			utmDimension: 'utm_source,utm_medium',
		},
	},
};
