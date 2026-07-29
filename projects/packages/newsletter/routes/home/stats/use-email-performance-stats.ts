import { getSiteData } from '@automattic/jetpack-script-data';
import { useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import type { StatsPeriod } from './placeholder-data';

type EmailOverviewResponse = {
	totals?: {
		total_sends?: number | string | null;
		opens?: number | string | null;
		clicks?: number | string | null;
	};
};

export type EmailPerformanceStats = {
	openRate: number | null;
	clickRate: number | null;
	ctor: number | null;
	isLoading: boolean;
};

type EmailPerformanceTotals = {
	totalSends: number;
	opens: number;
	clicks: number;
};

type DateRange = {
	start_date: string;
	end_date: string;
};

const PERIOD_DAYS: Record< StatsPeriod, number > = {
	'7d': 7,
	'30d': 30,
	'90d': 90,
	year: 365,
};

/**
 * Format a date for Stats query params.
 *
 * @param date - Date to format.
 * @return Date string in YYYY-MM-DD shape.
 */
function toDatePart( date: Date ): string {
	return date.toISOString().slice( 0, 10 );
}

/**
 * Translate the dashboard period into an inclusive date range.
 *
 * @param period - Dashboard range.
 * @return Date range for `/stats/emails/overview`.
 */
export function getEmailPerformanceDateRange( period: StatsPeriod ): DateRange {
	const end = new Date();
	const start = new Date( end );

	start.setUTCDate( start.getUTCDate() - ( PERIOD_DAYS[ period ] - 1 ) );

	return {
		start_date: toDatePart( start ),
		end_date: toDatePart( end ),
	};
}

/**
 * Normalize numeric fields from the overview response.
 *
 * @param value - Raw metric value.
 * @return Number, or 0 when missing.
 */
function parseMetricValue( value: number | string | null | undefined ): number {
	if ( typeof value === 'number' ) {
		return Number.isFinite( value ) ? value : 0;
	}

	if ( typeof value !== 'string' ) {
		return 0;
	}

	const parsed = Number( value );

	return Number.isFinite( parsed ) ? parsed : 0;
}

/**
 * Extract the raw aggregate totals from the WPCOM overview response.
 *
 * @param response - Raw response from `/stats/emails/overview`.
 * @return Totals needed for the headline rates.
 */
export function normalizeEmailPerformanceTotals(
	response: EmailOverviewResponse | undefined
): EmailPerformanceTotals {
	const totals = response?.totals;

	return {
		totalSends: parseMetricValue( totals?.total_sends ),
		opens: parseMetricValue( totals?.opens ),
		clicks: parseMetricValue( totals?.clicks ),
	};
}

/**
 * Safely divide two counts into a rate.
 *
 * @param numerator   - Top of the fraction.
 * @param denominator - Bottom of the fraction.
 * @return Rate as a fraction, or null when unavailable.
 */
function rate( numerator: number, denominator: number ): number | null {
	if ( denominator <= 0 ) {
		return null;
	}

	return numerator / denominator;
}

/**
 * Derive the visible headline rates from aggregate email event totals.
 *
 * @param totals - Raw event totals.
 * @return Open rate, click rate, and click-to-open rate.
 */
export function deriveEmailPerformanceStats(
	totals: EmailPerformanceTotals
): Omit< EmailPerformanceStats, 'isLoading' > {
	return {
		openRate: rate( totals.opens, totals.totalSends ),
		clickRate: rate( totals.clicks, totals.totalSends ),
		ctor: rate( totals.clicks, totals.opens ),
	};
}

/**
 * Fetch newsletter-wide email performance for the selected dashboard period.
 *
 * @param period - Dashboard range.
 * @return Email performance state.
 */
export function useEmailPerformanceStats( period: StatsPeriod ): EmailPerformanceStats {
	const blogId = getSiteData()?.wpcom?.blog_id;

	const query = useQuery< Omit< EmailPerformanceStats, 'isLoading' >, Error >( {
		queryKey: [ 'newsletter-email-performance', blogId, period ],
		queryFn: async () => {
			if ( ! blogId ) {
				return { openRate: null, clickRate: null, ctor: null };
			}

			try {
				const response = await apiFetch< EmailOverviewResponse >( {
					path: addQueryArgs(
						`/jetpack/v4/stats-app/sites/${ blogId }/stats/emails/overview`,
						getEmailPerformanceDateRange( period )
					),
				} );

				return deriveEmailPerformanceStats( normalizeEmailPerformanceTotals( response ) );
			} catch {
				return { openRate: null, clickRate: null, ctor: null };
			}
		},
		placeholderData: previousData => previousData,
	} );

	return {
		openRate: query.data?.openRate ?? null,
		clickRate: query.data?.clickRate ?? null,
		ctor: query.data?.ctor ?? null,
		isLoading: query.isLoading,
	};
}
