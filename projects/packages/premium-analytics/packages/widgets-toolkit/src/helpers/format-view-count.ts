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
