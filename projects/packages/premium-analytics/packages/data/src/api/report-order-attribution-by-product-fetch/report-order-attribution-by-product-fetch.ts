/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import { reportsPath } from '../constants';
import type { FilterCondition } from '../../types/filter-condition';
import type { BaseReportParams } from '../../utils/types';
import type { ORDER_ATTRIBUTION_VIEWS } from '../report-order-attribution-summary-fetch/report-order-attribution-summary-fetch';

type OrderAttributionView = ( typeof ORDER_ATTRIBUTION_VIEWS )[ number ];

type OrderAttributionByProductInterval = {
	time_interval: string;
	date_start: string;
	date_end: string;
	net_sales: string;
};

type OrderAttributionByProductItem = {
	item: string;
	value: string;
	intervals: OrderAttributionByProductInterval[];
};

export type OrderAttributionByProductResponse = {
	view: OrderAttributionView;
	order_by: string;
	data: OrderAttributionByProductItem[];
};

export type RequestReportOrderAttributionByProductParams = BaseReportParams & {
	view: OrderAttributionView;
	filters?: FilterCondition[];
};

/**
 * Fetches order attribution by product data from the WC Analytics REST API
 *
 * This endpoint supports product filtering similar to fetchReportOrdersByProductType.
 * Unlike the regular order-attribution endpoint, this one:
 * - Does not support compare_from/compare_to parameters
 * - Returns data in a flatter structure (no current_period/previous_period nesting)
 * - Requires separate requests for comparison data
 *
 * @param params - Query parameters
 * @return Promise resolving to order attribution by product response
 */
export async function fetchReportOrderAttributionByProduct(
	params: RequestReportOrderAttributionByProductParams
): Promise< OrderAttributionByProductResponse > {
	const { from, to, interval, view, filters, date_type } = params;

	const queryParams: Record< string, any > = {
		from,
		to,
		interval,
		view,
		date_type,
	};

	// Add filters to query params if provided
	if ( filters && filters.length > 0 ) {
		queryParams.filters = filters;
	}

	const path = addQueryArgs(
		`${ reportsPath }/order-attribution-by-product/${ view }/summary`,
		queryParams
	);

	return apiFetch< OrderAttributionByProductResponse >( { path } );
}
