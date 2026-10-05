/**
 * Internal dependencies
 */
import { useReport } from '@jetpack-premium-analytics/data/src/hooks/use-report';
import { type ReportParams } from '@jetpack-premium-analytics/data/src/utils/search';
import { reportVisitorsByLocationQuery } from '../queries/report-visitors-by-location-query';

type UseReportVisitorsByLocationOptions = {
	enabled?: boolean;
	groupBy?: 'country' | 'region';
	countryCode?: string;
	limit?: number;
};

export function useReportVisitorsByLocation(
	params: ReportParams,
	options?: UseReportVisitorsByLocationOptions
) {
	return useReport(
		p =>
			reportVisitorsByLocationQuery( {
				...p,
				group_by: options?.groupBy ?? 'country',
				country_code: options?.countryCode,
				limit: options?.limit,
			} ),
		params,
		{
			enabled: options?.enabled,
			disabledComparisonKey: [ 'reports', 'visitors', 'by-location', '__comparison__', 'disabled' ],
		}
	);
}
