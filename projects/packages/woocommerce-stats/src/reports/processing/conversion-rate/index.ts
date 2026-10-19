/**
 * Internal dependencies
 */
import { fetchReportConversionRate } from '../../api/report-conversion-rate-fetch';
import { safeParseInt } from '../../utils/parsing';
import { withBucketStamps } from '../utils';
import type { Override } from '../../utils/types';

type ReportsConversionRateByDateResponse = Awaited<
	ReturnType< typeof fetchReportConversionRate >
>;
type RawConversionRateReportDataItem = ReportsConversionRateByDateResponse[ 'data' ][ number ];
type SanitizedConversionRateByDateItem = Override<
	RawConversionRateReportDataItem,
	{
		active_sessions: number;
		visitors: number;
		with_cart_addition: number;
		reached_checkout: number;
		completed_checkout: number;
		/** Calculated; null for a period with no sessions, which has no rate. */
		conversion_rate: number | null;
	}
>;

function sanitizeConversionRateItem(
	item: RawConversionRateReportDataItem,
	zone: string
): SanitizedConversionRateByDateItem {
	const activeSessionsNum = safeParseInt( item.active_sessions );
	const visitorsNum = safeParseInt( item.visitors );
	const withCartAdditionNum = safeParseInt( item.with_cart_addition );
	const reachedCheckoutNum = safeParseInt( item.reached_checkout );
	const completedCheckoutNum = safeParseInt( item.completed_checkout );

	// A decimal (0.035 for 3.5%), the shape formatMetricValue's 'percentage' type reads.
	const conversionRate = activeSessionsNum > 0 ? completedCheckoutNum / activeSessionsNum : null;

	return {
		...withBucketStamps( item, zone ),
		active_sessions: activeSessionsNum,
		visitors: visitorsNum,
		with_cart_addition: withCartAdditionNum,
		reached_checkout: reachedCheckoutNum,
		completed_checkout: completedCheckoutNum,
		conversion_rate: conversionRate,
	};
}

type SanitizedConversionRateByDateResponse = {
	summary: SanitizedConversionRateByDateItem;
	data: SanitizedConversionRateByDateItem[];
};

/**
 * The `summary` single item has basically the same structure
 * as the `data` array items, so we can use the same mapper function for both.
 */
export const sanitizeReportConversionRateResponse = (
	response: ReportsConversionRateByDateResponse,
	zone: string
): SanitizedConversionRateByDateResponse => {
	// Handle cases where response might not have the expected structure
	const defaultSummary = {
		active_sessions: '0',
		visitors: '0',
		with_cart_addition: '0',
		reached_checkout: '0',
		completed_checkout: '0',
		date_start: '',
		date_end: '',
	};

	const sanitizedSummary = sanitizeConversionRateItem( response?.summary || defaultSummary, zone );

	return {
		summary: sanitizedSummary,
		data: response?.data
			? response.data.map( item => sanitizeConversionRateItem( item, zone ) )
			: [],
	};
};
