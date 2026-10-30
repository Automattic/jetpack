/**
 * Internal dependencies
 */
import { useReport } from '@automattic/jetpack-premium-analytics-sdk';
import { executedReportQuery, type ExecutedReportParams } from '../queries/report-execution-query';
import type { ReportParams } from '../utils/types';

/** A report served by the provider `execution` picks, for the report execution prototype. */
export function useExecutedReport(
	params: ReportParams,
	report: Omit< ExecutedReportParams, keyof ReportParams >
) {
	// The prototype shows one period, so the comparison query is never mounted.
	const primaryParams = { ...params };
	delete primaryParams.compare_from;
	delete primaryParams.compare_to;

	return useReport( p => executedReportQuery( { ...p, ...report } ), primaryParams, {
		disabledComparisonKey: [ 'reports', 'executed', report.route, '__comparison__', 'disabled' ],
	} );
}
