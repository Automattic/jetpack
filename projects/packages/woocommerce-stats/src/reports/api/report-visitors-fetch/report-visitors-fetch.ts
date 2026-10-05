/**
 * Internal dependencies
 */
import { fetchReport } from '../../fetch-report';
import type { BaseReportParams } from '@jetpack-premium-analytics/data/src/utils/types';

type ReportsVisitorsByDateSummary = {
	active_sessions: string;
	date_end: string;
	date_start: string;
	visitors: string;
};

type VisitorsReportDataItem = ReportsVisitorsByDateSummary & {
	time_interval: string;
};

type ReportsVisitorsByDateResponse = {
	data: VisitorsReportDataItem[];
	summary: ReportsVisitorsByDateSummary;
};

export type RequestReportVisitorsParams = BaseReportParams;

export async function fetchReportVisitors( {
	from,
	to,
	interval,
}: RequestReportVisitorsParams ): Promise< ReportsVisitorsByDateResponse > {
	return fetchReport< ReportsVisitorsByDateResponse >( 'sessions/by-date', {
		from,
		to,
		interval,
	} );
}
