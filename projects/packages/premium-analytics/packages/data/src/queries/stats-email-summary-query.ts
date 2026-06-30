/**
 * Internal dependencies
 */
import { statsProxyQuery } from './stats-query';
import type { StatsReportQueryOptions } from './stats-query';
import type { StatsEmailSummaryItem, StatsNormalizedReport } from '../processing/stats';

export type StatsEmailSummary = StatsNormalizedReport< StatsEmailSummaryItem >;

export type StatsEmailSummarySortField = 'opens' | 'clicks' | 'post_id' | 'post_date';

export interface StatsEmailSummaryParams {
	// Number of rows to return. The endpoint accepts 1–30 and resets anything outside that range
	// back to 10.
	quantity?: number;
	sort_field?: StatsEmailSummarySortField;
	sort_order?: 'asc' | 'desc';
}

// The emails summary always reports across the whole lifetime of the site, so it is always
// requested with period=alltime (matching the Calypso Emails screen); only the row count and sort
// are caller-controlled. sort_field defaults to post_date (newest first) to mirror Calypso; the
// server's own default is post_id.
export const statsEmailSummaryQuery = (
	params: StatsEmailSummaryParams = {}
): StatsReportQueryOptions< 'emailSummary' > =>
	statsProxyQuery( {
		name: 'email-summary',
		version: '1.1',
		endpoint: 'stats/emails/summary',
		params: {
			quantity: 10,
			sort_field: 'post_date',
			sort_order: 'desc',
			...params,
			// period is fixed after the spread: the endpoint is always all-time and callers
			// (including untyped ones) must not be able to narrow it.
			period: 'alltime',
		},
		sanitizer: 'emailSummary',
	} );
