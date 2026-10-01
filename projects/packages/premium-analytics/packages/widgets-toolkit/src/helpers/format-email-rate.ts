/**
 * External dependencies
 */
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import type { StatsEmailSummaryItem } from '@jetpack-premium-analytics/data';

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
 * The rate as a sort and export value: `undefined` when unknown, so it neither ranks nor
 * exports as a real 0%.
 *
 * @param rate    - The rate as the endpoint reports it.
 * @param signals - The counts behind the rate.
 * @return The rate, or undefined when it is unknown.
 */
export function getKnownEmailRate( rate: number, signals: EmailRateSignals ): number | undefined {
	return isEmailRateKnown( signals ) ? rate : undefined;
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

/**
 * The counts behind a summary row's open rate.
 *
 * @param item - The email summary row.
 * @return The open rate's signals.
 */
export const getOpensRateSignals = ( item: StatsEmailSummaryItem ): EmailRateSignals => ( {
	total: item.opens,
	unique: item.unique_opens,
	sends: item.total_sends,
} );

/**
 * The counts behind a summary row's click rate.
 *
 * @param item - The email summary row.
 * @return The click rate's signals.
 */
export const getClicksRateSignals = ( item: StatsEmailSummaryItem ): EmailRateSignals => ( {
	total: item.clicks,
	unique: item.unique_clicks,
	sends: item.total_sends,
} );
