/**
 * Internal dependencies
 */
import { fetchReport } from '../stats-proxy-fetch';
import type { BaseReportParams } from '../../utils/types';

export const ORDER_ATTRIBUTION_VIEWS = [
	'channel',
	'source',
	'campaign',
	'device',
	'channel-source',
] as const;

type OrderAttributionView = ( typeof ORDER_ATTRIBUTION_VIEWS )[ number ];

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

export type OrderAttributionSummaryResponse = {
	view: OrderAttributionView;
	order_by: string;
	data: OrderAttributionSummaryItem[];
};

export type RequestReportOrderAttributionSummaryParams = BaseReportParams & {
	view: OrderAttributionView;
	compare_from: string;
	compare_to: string;
};

/**
 * Unlike the orders endpoint, this one returns both primary and comparison data in a
 * single response. It requires `compare_from`/`compare_to`; when no comparison is
 * needed, callers pass the primary range values for both.
 */
export async function fetchReportOrderAttributionSummary(
	params: RequestReportOrderAttributionSummaryParams
): Promise< OrderAttributionSummaryResponse > {
	const { from, to, interval, view, compare_from, compare_to, date_type } = params;

	const queryParams: Record< string, string | undefined > = {
		from,
		to,
		interval,
		view,
		compare_from,
		compare_to,
		date_type,
	};

	return fetchReport< OrderAttributionSummaryResponse >(
		`order-attribution/${ view }/summary`,
		queryParams
	);
}
