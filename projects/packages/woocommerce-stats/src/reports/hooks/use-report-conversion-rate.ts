/**
 * Internal dependencies
 */
import { useReport } from '@jetpack-premium-analytics/data/src/hooks/use-report';
import { type ReportParams } from '@jetpack-premium-analytics/data/src/utils/search';
import { reportConversionRateQuery } from '../queries/report-conversion-rate-query';

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
