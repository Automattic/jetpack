/**
 * Internal dependencies
 */
import { reportVisitorsByLocationQuery } from '../queries/report-visitors-by-location-query';
import { type ReportParams } from '../utils/search';
import { useReport } from './use-report';

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
