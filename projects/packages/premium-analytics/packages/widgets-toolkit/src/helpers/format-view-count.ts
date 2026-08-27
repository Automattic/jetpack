/**
 * External dependencies
 */
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { _n, sprintf } from '@wordpress/i18n';

/**
 * A view count with its unit, pluralized and thousands-separated.
 *
 * Shared by the calendar heatmap tooltips, which would otherwise each carry their
 * own copy of the same plural forms to keep in sync.
 */
export function formatViewCount( count: number ): string {
	return sprintf(
		/* translators: %s: number of views, e.g. "2,033". */
		_n( '%s view', '%s views', count, 'jetpack-premium-analytics-pkg' ),
		formatMetricValue( count, 'number', { decimals: 0 } )
	);
}

/**
 * The same count as a daily rate, for a cell that reports an average rather
 * than a total. Kept beside `formatViewCount` so the two plural sets stay
 * together.
 */
export function formatDailyViewCount( count: number ): string {
	return sprintf(
		/* translators: %s: average number of views per day, e.g. "2,033". */
		_n( '%s view per day', '%s views per day', count, 'jetpack-premium-analytics-pkg' ),
		formatMetricValue( count, 'number', { decimals: 0 } )
	);
}
