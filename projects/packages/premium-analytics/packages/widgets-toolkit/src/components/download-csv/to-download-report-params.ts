/**
 * External dependencies
 */
import {
	hasComparisonEnabled,
	type DownloadReportParams,
	type ReportParams,
} from '@jetpack-premium-analytics/data';

/**
 * Map dashboard report parameters to the direct-download API contract.
 *
 * @param reportType   - Report key supported by the export endpoint.
 * @param reportParams - Normalized dashboard report parameters.
 * @return Parameters for the direct report download.
 */
export function toDownloadReportParams(
	reportType: string,
	reportParams: ReportParams
): DownloadReportParams {
	return {
		reportType,
		from: reportParams.from,
		to: reportParams.to,
		interval: reportParams.interval,
		...( reportParams.date_type ? { dateType: reportParams.date_type } : {} ),
		...( hasComparisonEnabled( reportParams )
			? {
					compareFrom: reportParams.compare_from,
					compareTo: reportParams.compare_to,
			  }
			: {} ),
	};
}
