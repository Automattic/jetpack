/**
 * Internal dependencies
 */
import { fetchReportVisitors } from '../../api/report-visitors-fetch';
import { withBucketStamps } from '../utils';
import type { Override } from '../../utils/types';

type ReportsVisitorsByDateResponse = Awaited< ReturnType< typeof fetchReportVisitors > >;
type RawVisitorsReportDataItem = ReportsVisitorsByDateResponse[ 'data' ][ number ];
type RawVisitorsReportDataSummary = ReportsVisitorsByDateResponse[ 'summary' ];

type SanitizedVisitorsByDateItem = Override<
	RawVisitorsReportDataItem,
	{
		active_sessions: number;
		visitors: number;
		time_interval?: string;
	}
>;

type SanitizedVisitorsByDateSummary = Override<
	RawVisitorsReportDataSummary,
	{
		active_sessions: number;
		visitors: number;
	}
>;

type SanitizeVisitorsItemArg = Override<
	RawVisitorsReportDataItem,
	{
		time_interval?: string;
	}
>;

function sanitizeVisitorsItem(
	item: SanitizeVisitorsItemArg,
	zone: string
): SanitizedVisitorsByDateItem {
	return {
		...withBucketStamps( item, zone ),
		active_sessions: parseInt( item.active_sessions, 10 ),
		visitors: parseInt( item.visitors, 10 ),
	};
}

type SanitizedVisitorsByDateResponse = {
	summary: SanitizedVisitorsByDateSummary;
	data: SanitizedVisitorsByDateItem[];
};

/**
 * The `summary` single item has basically the same structure
 * as the `data` array items, so we can use the same mapper function for both.
 */
export const sanitizeReportVisitorsResponse = (
	response: ReportsVisitorsByDateResponse,
	zone: string
): SanitizedVisitorsByDateResponse => {
	const defaultSummary = {
		active_sessions: '0',
		visitors: '0',
		date_start: '',
		date_end: '',
	};

	return {
		summary: sanitizeVisitorsItem( response?.summary ?? defaultSummary, zone ),
		data: response?.data ? response.data.map( item => sanitizeVisitorsItem( item, zone ) ) : [],
	};
};
