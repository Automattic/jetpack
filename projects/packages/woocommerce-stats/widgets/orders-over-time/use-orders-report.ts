/**
 * External dependencies
 */
import {
	fetchReport,
	resolveReportTimeZone,
	toBucketStamp,
	useReport,
} from '@automattic/jetpack-premium-analytics-sdk';

type OrdersRow = {
	date_start: string;
	date_end: string;
	orders_no: number;
};

type OrdersResponse = {
	summary: OrdersRow;
	data: OrdersRow[];
};

type OrdersParams = {
	from?: string;
	to?: string;
	interval?: string;
	date_type?: string;
};

/**
 * Parse the field this widget charts and stamp the bucket bounds in the site zone.
 *
 * @param row  - One orders/by-date row.
 * @param zone - Reporting timezone the bucket bounds are stamped in.
 */
function sanitizeOrdersRow(
	row: { date_start?: string; date_end?: string; orders_no?: string | number } | undefined,
	zone: string
): OrdersRow {
	const orders = Number.parseInt( String( row?.orders_no ?? '' ), 10 );

	return {
		...row,
		date_start: toBucketStamp( row?.date_start, zone ),
		date_end: toBucketStamp( row?.date_end, zone ),
		orders_no: Number.isNaN( orders ) ? 0 : orders,
	};
}

/**
 * Orders-by-date query. Comparison dates are applied by `useReport` before this runs.
 *
 * @param params - Primary or comparison range.
 */
function ordersByDateQuery( params: OrdersParams ) {
	const timezone = resolveReportTimeZone();

	return {
		queryKey: [
			'reports',
			'orders',
			params.from,
			params.to,
			params.interval,
			params.date_type,
			timezone,
		],
		queryFn: async (): Promise< OrdersResponse > => {
			const response = await fetchReport< {
				summary?: OrdersRow;
				data?: OrdersRow[];
			} >( 'orders/by-date', {
				from: params.from,
				to: params.to,
				interval: params.interval,
				date_type: params.date_type,
			} );

			return {
				summary: sanitizeOrdersRow( response?.summary, timezone ),
				data: ( response?.data ?? [] ).map( row => sanitizeOrdersRow( row, timezone ) ),
			};
		},
		enabled: Boolean( params.from && params.to && params.interval ),
		placeholderData: ( previous: OrdersResponse | undefined ) => previous,
	};
}

/**
 * Orders placed over the dashboard's date range, with the comparison period when the host asks.
 *
 * @param params - Report params from the widget host.
 */
export function useOrdersReport( params: OrdersParams ) {
	return useReport( ordersByDateQuery, params, {
		disabledComparisonKey: [ 'reports', 'orders', 'by-date', '__comparison__', 'disabled' ],
	} );
}
