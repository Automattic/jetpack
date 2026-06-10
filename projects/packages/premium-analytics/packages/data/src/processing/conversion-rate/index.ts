/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { fetchReportConversionRate } from '../../api/report-conversion-rate-fetch';
import { safeParseInt } from '../../utils/parsing';
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
		conversion_rate: number; // calculated field
	}
>;

/**
 * Sanitize/process a single conversion rate item by converting strings to numbers
 * and calculating the conversion rate
 */
function sanitizeConversionRateItem(
	item: RawConversionRateReportDataItem
): SanitizedConversionRateByDateItem {
	const activeSessionsNum = safeParseInt( item.active_sessions );
	const visitorsNum = safeParseInt( item.visitors );
	const withCartAdditionNum = safeParseInt( item.with_cart_addition );
	const reachedCheckoutNum = safeParseInt( item.reached_checkout );
	const completedCheckoutNum = safeParseInt( item.completed_checkout );

	// Calculate conversion rate as decimal (e.g., 0.035 for 3.5%)
	// This format works with formatMetricValue 'percentage' type
	const conversionRate = activeSessionsNum > 0 ? completedCheckoutNum / activeSessionsNum : 0;

	return {
		...item,
		active_sessions: activeSessionsNum,
		visitors: visitorsNum,
		with_cart_addition: withCartAdditionNum,
		reached_checkout: reachedCheckoutNum,
		completed_checkout: completedCheckoutNum,
		conversion_rate: conversionRate,
	};
}

/**
 * Funnel step for conversion rate visualization
 */
type FunnelStep = {
	id: string;
	label: string;
	count: number;
	rate: number;
};

/**
 * Processed response with funnel steps and overall conversion rate
 */
type SanitizedConversionRateByDateResponse = {
	summary: SanitizedConversionRateByDateItem;
	data: SanitizedConversionRateByDateItem[];
	steps: FunnelStep[];
	overallRate: number;
};

/**
 * Sanitize the response from the sessions/by-conversion-rate endpoint
 * Converts string values to numbers for easier calculations and charting.
 *
 * The `summary` single item has basically the same structure
 * as the `data` array items, so we can use the same mapper function for both.
 */
export const sanitizeReportConversionRateResponse = (
	response: ReportsConversionRateByDateResponse
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

	const sanitizedSummary = sanitizeConversionRateItem( response?.summary || defaultSummary );

	// Create funnel steps from the summary data
	const steps: FunnelStep[] = [
		{
			id: 'sessions',
			label: __( 'Sessions', 'jetpack-premium-analytics' ),
			count: sanitizedSummary.active_sessions,
			rate: 100, // Starting point
		},
		{
			id: 'cart-addition',
			label: __( 'Cart', 'jetpack-premium-analytics' ),
			count: sanitizedSummary.with_cart_addition,
			rate:
				sanitizedSummary.active_sessions > 0
					? ( sanitizedSummary.with_cart_addition / sanitizedSummary.active_sessions ) * 100
					: 0,
		},
		{
			id: 'checkout',
			label: __( 'Checkout', 'jetpack-premium-analytics' ),
			count: sanitizedSummary.reached_checkout,
			rate:
				sanitizedSummary.active_sessions > 0
					? ( sanitizedSummary.reached_checkout / sanitizedSummary.active_sessions ) * 100
					: 0,
		},
		{
			id: 'completed',
			label: __( 'Purchase', 'jetpack-premium-analytics' ),
			count: sanitizedSummary.completed_checkout,
			rate:
				sanitizedSummary.active_sessions > 0
					? ( sanitizedSummary.completed_checkout / sanitizedSummary.active_sessions ) * 100
					: 0,
		},
	];

	return {
		summary: sanitizedSummary,
		data: response?.data ? response.data.map( sanitizeConversionRateItem ) : [],
		steps,
		overallRate: sanitizedSummary.conversion_rate,
	};
};
