/**
 * Internal dependencies
 */
import { fetchReport } from '../stats-proxy-fetch';
import type { BaseReportParams } from '../../utils/types';

type VisitorsByLocationReportDataItem = {
	country_code: string;
	label: string;
	region?: string;
	visitors: string;
};

type ReportsVisitorsByLocationSummary = {
	visitors: string;
	date_start: string;
	date_end: string;
};

type ReportsVisitorsByLocationResponse = {
	data: VisitorsByLocationReportDataItem[];
	summary?: ReportsVisitorsByLocationSummary;
};

export type RequestReportVisitorsByLocationParams = BaseReportParams & {
	group_by: 'country' | 'region';
	country_code?: string;
	limit?: number;
};

export async function fetchReportVisitorsByLocation( {
	from,
	to,
	interval,
	group_by,
	country_code,
	limit,
}: RequestReportVisitorsByLocationParams ): Promise< ReportsVisitorsByLocationResponse > {
	return fetchReport< ReportsVisitorsByLocationResponse >( 'sessions/by-location', {
		from,
		to,
		interval,
		group_by,
		country_code,
		limit,
	} );
}
