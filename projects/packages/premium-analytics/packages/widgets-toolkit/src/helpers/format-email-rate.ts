/**
 * External dependencies
 */
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';

/**
 * Whether an email rate can be known. Rates count unique recipients, so events with no
 * attributable recipient (link scanners, view-in-browser clicks) make the rate unknown, not 0%.
 *
 * @param total  - Total event count.
 * @param unique - Unique (attributed) event count.
 * @return False when events exist but none is attributed to a recipient.
 */
export function isEmailRateKnown( total: number, unique: number ): boolean {
	return total === 0 || unique > 0;
}

/**
 * Format an email summary rate, which the endpoint reports as a 0–100 percentage.
 *
 * @param rate   - The 0–100 rate.
 * @param total  - Total event count.
 * @param unique - Unique (attributed) event count.
 * @return The formatted percentage, or an em dash when the rate is unknown.
 */
export function formatEmailRate( rate: number, total: number, unique: number ): string {
	if ( ! isEmailRateKnown( total, unique ) ) {
		return '—';
	}

	// `percentage` defaults to `exceptZero`, which would print `+12%`.
	return formatMetricValue( rate / 100, 'percentage', { decimals: 2, signDisplay: 'auto' } );
}
