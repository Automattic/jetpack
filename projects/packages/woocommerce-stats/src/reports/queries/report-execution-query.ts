/**
 * Internal dependencies
 */
import { fetchReport, type ReportExecution } from '../fetch-report';
import type { BaseReportParams } from '../utils/types';
import type { ReportQuery } from '@automattic/jetpack-premium-analytics-sdk';

export type ReportProvenance = {
	provider: 'local' | 'remote';
	/** Report id and version, e.g. `orders.by_date@1`. */
	contract: string;
	generated_at: string;
	fields: string[] | null;
	unsupported_fields: string[];
	/** Where the provider's semantics differ from the report definition's, e.g. `{ week_start: 'sunday' }`. */
	deviations: Record< string, string >;
};

/** A report as the executor answers it: the wpcom shape, values left as sent, plus provenance. */
export type ExecutedReport = {
	summary: Record< string, string | number | null >;
	data: Record< string, string | number | null >[];
	provenance?: ReportProvenance;
};

export type ExecutedReportParams = Partial< BaseReportParams > & {
	route: string;
	execution: ReportExecution;
	/** Report params the route takes; the rest of the dashboard's params are not sent. */
	send: ( keyof BaseReportParams )[];
	/** The report fields the widget reads; only a provider that produces all of them is picked. */
	fields: string[];
};

// The executor's own failures carry a `reason` and will not heal on a retry.
function shouldRetry( failureCount: number, error: unknown ) {
	const reason = ( error as { data?: { reason?: unknown } } | null )?.data?.reason;

	return ! reason && failureCount < 2;
}

export function executedReportQuery( params: ExecutedReportParams ): ReportQuery< ExecutedReport > {
	const { route, execution, send, fields } = params;
	const sent = Object.fromEntries( send.map( key => [ key, params[ key ] ] ) );

	const query = {
		queryKey: [ 'reports', 'executed', route, execution, fields, sent ],
		queryFn: () => fetchReport< ExecutedReport >( route, sent, { execution, fields } ),
		enabled: send.every( key => !! params[ key ] ),
		placeholderData: ( previousData: ExecutedReport | undefined ) => previousData,
		retry: shouldRetry,
	};

	return query;
}
