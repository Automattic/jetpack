/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import { reportsPath } from '../constants';
import type { BaseReportParams } from '../../utils/types';

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

/**
 *
 * @param root0
 * @param root0.from
 * @param root0.to
 * @param root0.interval
 */
export async function fetchReportVisitors( {
	from,
	to,
	interval,
}: RequestReportVisitorsParams ): Promise< ReportsVisitorsByDateResponse > {
	const path = addQueryArgs( `${ reportsPath }/sessions/by-date`, {
		from,
		to,
		interval,
	} );

	return apiFetch( { path } ) as Promise< ReportsVisitorsByDateResponse >;
}
