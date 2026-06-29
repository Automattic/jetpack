/**
 * Internal dependencies
 */
import { fetchReportOrderAttributionSummary } from '../../api/report-order-attribution-summary-fetch';
import { sanitizeStringNumber } from '../utils';

type OrderAttributionSummaryResponse = Awaited<
	ReturnType< typeof fetchReportOrderAttributionSummary >
>;

type OrderAttributionView = OrderAttributionSummaryResponse[ 'view' ];

/**
 * Internal types for processing
 */
type OrderAttributionInterval = {
	time_interval: string;
	date_start: string;
	date_end: string;
	net_sales: string;
};

type OrderAttributionPeriod = {
	value: string;
	intervals: OrderAttributionInterval[];
};

type OrderAttributionSummaryItem = {
	item: string;
	current_period: OrderAttributionPeriod;
	previous_period: OrderAttributionPeriod;
};

/**
 * Processed (sanitized) response types
 */
type SanitizedOrderAttributionInterval = {
	time_interval: string;
	date_start: string;
	date_end: string;
	net_sales: number;
};

type SanitizedOrderAttributionPeriod = {
	value: number;
	intervals: SanitizedOrderAttributionInterval[];
};

type SanitizedOrderAttributionSummaryItem = {
	item: string;
	current_period: SanitizedOrderAttributionPeriod;
	previous_period: SanitizedOrderAttributionPeriod;
};

export type SanitizedOrderAttributionSummaryResponse = {
	view: OrderAttributionView;
	order_by: string;
	data: SanitizedOrderAttributionSummaryItem[];
};

/**
 * Sanitizes a single interval by converting string net_sales to number
 */
function sanitizeOrderAttributionInterval(
	interval: OrderAttributionInterval
): SanitizedOrderAttributionInterval {
	return {
		time_interval: interval.time_interval,
		date_start: interval.date_start,
		date_end: interval.date_end,
		net_sales: sanitizeStringNumber( interval.net_sales ),
	};
}

/**
 * Sanitizes a period by converting value to number and intervals
 */
function sanitizeOrderAttributionPeriod(
	period: OrderAttributionPeriod
): SanitizedOrderAttributionPeriod {
	return {
		value: sanitizeStringNumber( period.value ),
		intervals: period.intervals.map( sanitizeOrderAttributionInterval ),
	};
}

/**
 * Sanitizes a single order attribution summary item
 */
function sanitizeOrderAttributionSummaryItem(
	item: OrderAttributionSummaryItem
): SanitizedOrderAttributionSummaryItem {
	return {
		item: item.item,
		current_period: sanitizeOrderAttributionPeriod( item.current_period ),
		previous_period: sanitizeOrderAttributionPeriod( item.previous_period ),
	};
}

/**
 * Sanitizes the order attribution summary response by converting all string
 * numbers to actual numbers
 *
 * @param response - Raw API response from /summary endpoint
 * @return Sanitized response with numbers instead of strings
 */
export function sanitizeReportOrderAttributionSummaryResponse(
	response: OrderAttributionSummaryResponse
): SanitizedOrderAttributionSummaryResponse {
	return {
		view: response.view,
		order_by: response.order_by,
		data: response.data.map( sanitizeOrderAttributionSummaryItem ),
	};
}
