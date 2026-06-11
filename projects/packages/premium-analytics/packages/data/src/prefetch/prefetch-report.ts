/**
 * Internal dependencies
 */
import { queryClient } from '../providers';
import {
	reportOrdersQuery,
	reportOrderAttributionSummaryQuery,
	reportCouponsQuery,
	reportCouponsByDateQuery,
	reportCustomersQuery,
	reportCustomersByDateQuery,
	reportVisitorsQuery,
	reportVisitorsByLocationQuery,
	reportSessionsByDeviceQuery,
	reportProductsQuery,
	reportConversionRateQuery,
} from '../queries';

type RequestReportParamsMap = {
	orders: Parameters< typeof reportOrdersQuery >[ 0 ];
	'order-attribution': Parameters< typeof reportOrderAttributionSummaryQuery >[ 0 ];
	coupons: Parameters< typeof reportCouponsQuery >[ 0 ];
	'coupons-by-date': Parameters< typeof reportCouponsByDateQuery >[ 0 ];
	customers: Parameters< typeof reportCustomersQuery >[ 0 ];
	'customers-by-date': Parameters< typeof reportCustomersByDateQuery >[ 0 ];
	visitors: Parameters< typeof reportVisitorsQuery >[ 0 ];
	'visitors-by-location': Parameters< typeof reportVisitorsByLocationQuery >[ 0 ];
	'sessions-by-device': Parameters< typeof reportSessionsByDeviceQuery >[ 0 ];
	products: Parameters< typeof reportProductsQuery >[ 0 ];
	'conversion-rate': Parameters< typeof reportConversionRateQuery >[ 0 ];
};

export async function prefetchReport< T extends keyof RequestReportParamsMap >(
	reportType: T = 'orders' as T,
	params: RequestReportParamsMap[ T ]
) {
	switch ( reportType ) {
		case 'orders':
			return queryClient.ensureQueryData(
				reportOrdersQuery( params as RequestReportParamsMap[ 'orders' ] )
			);

		case 'order-attribution':
			return queryClient.ensureQueryData(
				reportOrderAttributionSummaryQuery(
					params as RequestReportParamsMap[ 'order-attribution' ]
				)
			);

		case 'coupons':
			return queryClient.ensureQueryData(
				reportCouponsQuery( params as RequestReportParamsMap[ 'coupons' ] )
			);

		case 'coupons-by-date':
			return queryClient.ensureQueryData(
				reportCouponsByDateQuery( params as RequestReportParamsMap[ 'coupons-by-date' ] )
			);

		case 'customers':
			return queryClient.ensureQueryData(
				reportCustomersQuery( params as RequestReportParamsMap[ 'customers' ] )
			);

		case 'customers-by-date':
			return queryClient.ensureQueryData(
				reportCustomersByDateQuery( params as RequestReportParamsMap[ 'customers-by-date' ] )
			);

		case 'visitors':
			return queryClient.ensureQueryData(
				reportVisitorsQuery( params as RequestReportParamsMap[ 'visitors' ] )
			);

		case 'visitors-by-location':
			return queryClient.ensureQueryData(
				reportVisitorsByLocationQuery( params as RequestReportParamsMap[ 'visitors-by-location' ] )
			);

		case 'sessions-by-device':
			return queryClient.ensureQueryData(
				reportSessionsByDeviceQuery( params as RequestReportParamsMap[ 'sessions-by-device' ] )
			);

		case 'products':
			return queryClient.ensureQueryData(
				reportProductsQuery( params as RequestReportParamsMap[ 'products' ] )
			);

		case 'conversion-rate':
			return queryClient.ensureQueryData(
				reportConversionRateQuery( params as RequestReportParamsMap[ 'conversion-rate' ] )
			);

		default:
			throw new Error( `Unsupported report type: ${ reportType }` );
	}
}
