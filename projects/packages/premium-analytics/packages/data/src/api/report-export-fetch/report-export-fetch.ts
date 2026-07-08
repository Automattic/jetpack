/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Export request parameters
 */
export interface ExportReportParams {
	reportType: string | string[];
	from: string; // ISO 8601 date string
	to: string; // ISO 8601 date string
	interval?: string;
	compareFrom?: string; // ISO 8601 date string
	compareTo?: string; // ISO 8601 date string
}

/**
 * Export response from the API
 */
export interface ExportReportResponse {
	success: boolean;
	message: string;
	job_ids?: Record< string, number >; // Multiple report exports
	partial?: boolean; // Indicates if some exports failed
	errors?: Record< string, string >; // Failed report types and their error messages
}

/**
 * Export one or more reports via email
 *
 * @param params - Export parameters
 * @return Promise that resolves to the export response
 */
export async function exportReport( params: ExportReportParams ): Promise< ExportReportResponse > {
	const path = '/wc/v3/woocommerce-analytics/reports/csv-export';

	const body = {
		report_type: Array.isArray( params.reportType ) ? params.reportType : [ params.reportType ],
		from: params.from,
		to: params.to,
		interval: params.interval || 'day',
		delivery_method: 'email',
		...( params.compareFrom && params.compareTo
			? {
					compare_from: params.compareFrom,
					compare_to: params.compareTo,
			  }
			: {} ),
	};

	return apiFetch( {
		path,
		method: 'POST',
		data: body,
	} ) as Promise< ExportReportResponse >;
}
