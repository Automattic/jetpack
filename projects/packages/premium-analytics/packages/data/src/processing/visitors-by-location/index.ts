/**
 * Internal dependencies
 */
import { fetchReportVisitorsByLocation } from '../../api/report-visitors-by-location-fetch';
import type { Override } from '../../utils/types';

/**
 * Inferred types
 */
type ReportsVisitorsByLocationResponse = Awaited<
	ReturnType< typeof fetchReportVisitorsByLocation >
>;
type RawVisitorsByLocationItem = ReportsVisitorsByLocationResponse[ 'data' ][ number ];
type RawVisitorsByLocationSummary = NonNullable< ReportsVisitorsByLocationResponse[ 'summary' ] >;

type SanitizedVisitorsByLocationItem = Override<
	RawVisitorsByLocationItem,
	{
		visitors: number;
	}
>;

type SanitizedVisitorsByLocationSummary = Override<
	RawVisitorsByLocationSummary,
	{
		visitors: number;
	}
>;

function sanitizeVisitorsByLocationItem(
	item: RawVisitorsByLocationItem
): SanitizedVisitorsByLocationItem {
	const visitors = Number.parseInt( item.visitors, 10 );

	return {
		...item,
		visitors: Number.isNaN( visitors ) ? 0 : visitors,
	};
}

function sanitizeVisitorsByLocationSummary(
	summary: RawVisitorsByLocationSummary
): SanitizedVisitorsByLocationSummary {
	const visitors = Number.parseInt( summary.visitors, 10 );

	return {
		...summary,
		visitors: Number.isNaN( visitors ) ? 0 : visitors,
	};
}

type SanitizedVisitorsByLocationResponse = {
	summary: SanitizedVisitorsByLocationSummary;
	data: SanitizedVisitorsByLocationItem[];
};

export const sanitizeReportVisitorsByLocationResponse = (
	response: ReportsVisitorsByLocationResponse
): SanitizedVisitorsByLocationResponse => {
	const defaultSummary: RawVisitorsByLocationSummary = {
		visitors: '0',
		date_start: '',
		date_end: '',
	};

	return {
		summary: sanitizeVisitorsByLocationSummary( response?.summary ?? defaultSummary ),
		data: response?.data ? response.data.map( sanitizeVisitorsByLocationItem ) : [],
	};
};
