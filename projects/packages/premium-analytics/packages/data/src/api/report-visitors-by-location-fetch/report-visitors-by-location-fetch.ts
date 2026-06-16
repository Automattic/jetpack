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

/**
 * Fetch visitors grouped by location (country or region) for the selected period.
 *
 * This endpoint is proxied through `/jetpack-premium-analytics/v1/proxy/v2/analytics/reports/...`
 * and ultimately served by wpcom analytics.
 */
export async function fetchReportVisitorsByLocation( {
	from,
	to,
	interval,
	group_by,
	country_code,
	limit,
}: RequestReportVisitorsByLocationParams ): Promise< ReportsVisitorsByLocationResponse > {
	const path = addQueryArgs( `${ reportsPath }/sessions/by-location`, {
		from,
		to,
		interval,
		group_by,
		country_code,
		limit,
	} );

	return apiFetch( { path } ) as Promise< ReportsVisitorsByLocationResponse >;
}
