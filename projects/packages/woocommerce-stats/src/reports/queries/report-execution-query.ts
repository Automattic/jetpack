/**
 * Internal dependencies
 */
import { fetchReportWithHeaders, type ReportExecution } from '../fetch-report';
import type { BaseReportParams } from '../utils/types';
import type { ReportQuery } from '@automattic/jetpack-premium-analytics-sdk';

/** A report as the executor answers it: the wpcom shape, values left as sent. */
export type ExecutedReport = {
	summary: Record< string, string | number | null >;
	data: Record< string, string | number | null >[];
	/** Contract fields the provider cannot produce, present only when there are any. */
	unsupported_fields?: string[];
	/** Read from the `X-Jetpack-Report-Provider` response header. */
	provider?: string;
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
		queryFn: async () => {
			const { body, headers } = await fetchReportWithHeaders< ExecutedReport >( route, sent, {
				execution,
				fields,
			} );

			return { ...body, provider: headers?.get( 'X-Jetpack-Report-Provider' ) ?? undefined };
		},
		enabled: send.every( key => !! params[ key ] ),
		placeholderData: ( previousData: ExecutedReport | undefined ) => previousData,
		retry: shouldRetry,
	};

	return query;
}
