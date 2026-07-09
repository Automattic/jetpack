/**
 * Internal dependencies
 */
import { reportOrderAttributionSummaryQuery } from '../queries';
import { type ReportParams } from '../utils/search';
import { useReport } from './use-report';

type UseReportOrderAttributionOptions = {
	enabled?: boolean;
};

const DISABLED_COMPARISON_KEY = [
	'reports',
	'order-attribution',
	'__comparison__',
	'included-in-primary',
];

export function useReportOrderAttribution(
	params: ReportParams,
	options?: UseReportOrderAttributionOptions
) {
	/*
	 * Compare from and to are required for order attribution summary query.
	 * When they aren't provided, use the same dates as the primary period.
	 */
	const compareFrom = params.compare_from ?? params.from;
	const compareTo = params.compare_to ?? params.to;

	return useReport(
		( p, queryType ) => {
			// Order attribution requires the view parameter
			if ( ! params.view ) {
				return {
					queryKey: [ 'reports', 'order-attribution', '__disabled__', 'no-view-param' ],
					enabled: false,
				};
			}

			if ( queryType === 'comparison' ) {
				return {
					queryKey: DISABLED_COMPARISON_KEY,
					enabled: false,
				};
			}

			return reportOrderAttributionSummaryQuery( {
				...p,
				view: params.view,
				compare_from: compareFrom,
				compare_to: compareTo,
				date_type: params.date_type,
				filters: params.filters,
			} );
		},
		params,
		{
			enabled: options?.enabled,
			disabledComparisonKey: DISABLED_COMPARISON_KEY,
		}
	);
}
