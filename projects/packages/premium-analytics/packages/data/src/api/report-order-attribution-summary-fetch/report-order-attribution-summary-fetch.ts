/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import { reportsPath } from '../constants';
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
 * Fetches order attribution summary data from the WC Analytics REST API
 *
 * Note: Order attribution summary endpoint returns both primary and comparison
 * data in a single response, unlike orders endpoint which requires
 * separate requests. The endpoint requires compare_from and compare_to parameters;
 * when no comparison is needed, it uses the same values as the primary range.
 *
 * @param params - Query parameters
 * @return Promise resolving to order attribution summary response
 */
export async function fetchReportOrderAttributionSummary(
	params: RequestReportOrderAttributionSummaryParams
): Promise< OrderAttributionSummaryResponse > {
	const { from, to, interval, view, compare_from, compare_to, date_type } = params;

	/*
	 * Order attribution endpoint requires compare_from and compare_to.
	 * When no comparison is needed, use the same values as primary range.
	 */
	const queryParams: Record< string, string | undefined > = {
		from,
		to,
		interval,
		view,
		compare_from,
		compare_to,
		date_type,
	};

	const path = addQueryArgs( `${ reportsPath }/order-attribution/${ view }/summary`, queryParams );

	return apiFetch< OrderAttributionSummaryResponse >( { path } );
}
