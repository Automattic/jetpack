/**
 * Internal dependencies
 */
import { fetchReport, type ReportExecution } from '../fetch-report';
import type { BaseReportParams } from '../utils/types';
import type { ReportQuery } from '@automattic/jetpack-premium-analytics-sdk';

export type ReportProvenance = {
	provider: 'local' | 'remote';
	generated_at: string;
	unsupported_fields: string[];
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
};

// The executor's own failures carry a `reason` and will not heal on a retry.
function shouldRetry( failureCount: number, error: unknown ) {
	const reason = ( error as { data?: { reason?: unknown } } | null )?.data?.reason;

	return ! reason && failureCount < 2;
}

export function executedReportQuery( params: ExecutedReportParams ): ReportQuery< ExecutedReport > {
	const { route, execution, send } = params;
	const sent = Object.fromEntries( send.map( key => [ key, params[ key ] ] ) );

	const query = {
		queryKey: [ 'reports', 'executed', route, execution, sent ],
		queryFn: () => fetchReport< ExecutedReport >( route, sent, { execution } ),
		enabled: send.every( key => !! params[ key ] ),
		placeholderData: ( previousData: ExecutedReport | undefined ) => previousData,
		retry: shouldRetry,
	};

	return query;
}
