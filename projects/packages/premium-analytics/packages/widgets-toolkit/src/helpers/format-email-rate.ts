/**
 * External dependencies
 */
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';

/**
 * Format an email summary rate, which the endpoint reports as a 0–100 percentage.
 *
 * Rates count unique recipients, so events with no attributable recipient (link scanners,
 * view-in-browser clicks) make the rate unknown rather than 0%, shown as an em dash.
 *
 * @param rate   - The 0–100 rate.
 * @param total  - Total event count.
 * @param unique - Unique (attributed) event count.
 * @return The formatted percentage, or an em dash when not attributable.
 */
export function formatEmailRate( rate: number, total: number, unique: number ): string {
	if ( total > 0 && unique === 0 ) {
		return '—';
	}

	return formatMetricValue( rate / 100, 'percentage', { decimals: 2, signDisplay: 'never' } );
}
