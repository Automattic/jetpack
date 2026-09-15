/**
 * External dependencies
 */
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';

export type EmailRateSignals = {
	/** Total event count (opens or clicks). */
	total: number;
	/** Unique (attributed) event count. */
	unique: number;
	/** Emails sent, the rate's denominator. */
	sends: number;
};

/**
 * Whether an email rate can be known, matching the legacy Emails module. With no sends the rate is
 * 0/0, and events with no attributable recipient (link scanners) leave the unique count unknown.
 *
 * @param signals - The counts behind the rate.
 * @return False when the rate is undefined or its unique count is unknown.
 */
export function isEmailRateKnown( signals: EmailRateSignals ): boolean {
	const { total, unique, sends } = signals;
	return sends > 0 && ( unique > 0 || total === 0 );
}

/**
 * Format an email summary rate, which the endpoint reports as a 0–100 percentage.
 *
 * @param rate    - The 0–100 rate.
 * @param signals - The counts behind the rate.
 * @return The formatted percentage, or an em dash when the rate is unknown.
 */
export function formatEmailRate( rate: number, signals: EmailRateSignals ): string {
	if ( ! isEmailRateKnown( signals ) ) {
		return '—';
	}

	// `percentage` defaults to `exceptZero`, which would print `+12%`.
	return formatMetricValue( rate / 100, 'percentage', { decimals: 2, signDisplay: 'auto' } );
}
