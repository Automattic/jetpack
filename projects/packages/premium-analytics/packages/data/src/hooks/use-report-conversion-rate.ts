/**
 * Internal dependencies
 */
import { reportConversionRateQuery } from '../queries';
import { type ReportParams } from '../utils/search';
import { useReport } from './use-report';

type UseReportConversionRateOptions = {
	enabled?: boolean;
};

export function useReportConversionRate(
	params: ReportParams,
	options?: UseReportConversionRateOptions
) {
	return useReport( p => reportConversionRateQuery( p ), params, {
		enabled: options?.enabled,
		disabledComparisonKey: [ 'reports', 'conversion-rate', '__comparison__', 'disabled' ],
	} );
}
