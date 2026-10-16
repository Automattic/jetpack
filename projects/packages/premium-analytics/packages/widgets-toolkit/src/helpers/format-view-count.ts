/**
 * External dependencies
 */
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
/**
 * Internal dependencies
 */
import { formatListMetricCount } from './list-metrics';

/**
 * A view count with its unit, pluralized and thousands-separated.
 *
 * Shared by the calendar heatmap tooltips, which would otherwise each carry their
 * own copy of the same plural forms to keep in sync.
 */
export function formatViewCount( count: number ): string {
	return formatListMetricCount(
		'views',
		count,
		formatMetricValue( count, 'number', { decimals: 0 } )
	);
}
