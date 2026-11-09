import { formatNumber } from '@automattic/number-formatters';
import { formatPercentage } from './format-percentage';
import type { DataPointPercentageCalculated } from '../types';

/**
 * What figure to show for a data point.
 * - 'percentage': its share of the total (e.g. "23%") [default]
 * - 'value': its raw value (e.g. "30000")
 * - 'valueDisplay': the value the consumer formatted (e.g. "30K")
 * - 'none': no figure, the label alone
 */
export type LegendValueDisplay = 'percentage' | 'value' | 'valueDisplay' | 'none';

/**
 * Formats a data point's figure for display, in the legend and in a segment's accessible name.
 *
 * @param point   - The data point, with the percentage charts calculated for it.
 * @param display - Which figure to show. Defaults to its share of the total.
 * @return The formatted figure, or an empty string for 'none'.
 */
export function formatDataPointValue(
	point: DataPointPercentageCalculated,
	display: LegendValueDisplay = 'percentage'
): string {
	switch ( display ) {
		case 'percentage':
			return formatPercentage( point.percentage );
		case 'value':
			return formatNumber( point.value );
		case 'valueDisplay':
			return point.valueDisplay || formatNumber( point.value );
		default:
			return '';
	}
}
