/**
 * Internal dependencies
 */
import { fetchReport } from '../stats-proxy-fetch';
import type { FilterCondition } from '../../types/filter-condition';
import type { BaseReportParams } from '../../utils/types';

type ReportsConversionRateByDateSummary = {
	active_sessions: string;
	visitors: string;
	with_cart_addition: string;
	reached_checkout: string;
	completed_checkout: string;
	date_end: string;
	date_start: string;
};

type ConversionRateReportDataItem = {
	date_start: string;
	date_end: string;
	active_sessions: string;
	visitors: string;
	with_cart_addition: string;
	reached_checkout: string;
	completed_checkout: string;
};

type ReportsConversionRateByDateResponse = {
	data: ConversionRateReportDataItem[];
	summary: ReportsConversionRateByDateSummary;
};

export type RequestReportConversionRateParams = BaseReportParams & {
	filters?: FilterCondition[];
};

export async function fetchReportConversionRate( {
	from,
	to,
	interval,
	filters,
}: RequestReportConversionRateParams ): Promise< ReportsConversionRateByDateResponse > {
	return fetchReport< ReportsConversionRateByDateResponse >( 'sessions/by-conversion-rate', {
		from,
		to,
		interval,
		filters,
	} );
}
