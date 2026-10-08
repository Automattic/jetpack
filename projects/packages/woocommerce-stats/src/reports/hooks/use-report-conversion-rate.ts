/**
 * Internal dependencies
 */
import { useReport } from '@automattic/jetpack-premium-analytics-sdk';
import { reportConversionRateQuery } from '../queries/report-conversion-rate-query';
import { type ReportParams } from '../utils/types';

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
