/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { __, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { saveBlob } from '../../utils/save-blob';
import { isResponse } from '../is-response';
import type { DateType } from '../../utils/types';

const REPORT_DOWNLOAD_PATH = '/jetpack-premium-analytics/v1/reports/csv-export';

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

/** Parameters for downloading one complete report as a CSV file. */
export interface DownloadReportParams extends Omit< ExportReportParams, 'reportType' > {
	reportType: string;
	dateType?: DateType;
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

/** The sanitized filename used for a downloaded report. */
export interface DownloadReportResponse {
	filename: string;
}

type ReportExportBody = {
	report_type: string;
	from: string;
	to: string;
	interval: string;
	delivery_method: 'download';
	date_type?: DateType;
	compare_from?: string;
	compare_to?: string;
};

/**
 * Build the request body for a direct report download.
 *
 * @param params - Export parameters.
 * @return Request body for the existing CSV export endpoint.
 */
export function buildReportExportBody( params: DownloadReportParams ): ReportExportBody {
	return {
		report_type: params.reportType,
		from: params.from,
		to: params.to,
		interval: params.interval || 'day',
		delivery_method: 'download',
		...( params.dateType ? { date_type: params.dateType } : {} ),
		...( params.compareFrom && params.compareTo
			? {
					compare_from: params.compareFrom,
					compare_to: params.compareTo,
			  }
			: {} ),
	};
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

/**
 * Request a browser download from the Premium Analytics CSV export endpoint.
 *
 * @param params - Export parameters.
 * @return The filename used for the downloaded CSV.
 */
export async function downloadReport(
	params: DownloadReportParams
): Promise< DownloadReportResponse > {
	let response: Response;

	try {
		response = await apiFetch( {
			path: REPORT_DOWNLOAD_PATH,
			method: 'POST',
			data: buildReportExportBody( params ),
			parse: false,
		} );
	} catch ( error ) {
		if ( isResponse( error ) ) {
			throw new Error( await getResponseErrorMessage( error ), { cause: error } );
		}

		throw error;
	}

	if ( ! response.ok ) {
		throw new Error( await getResponseErrorMessage( response ) );
	}

	const blob = await response.blob();
	const responseFilename =
		getFilenameFromContentDisposition( response.headers.get( 'Content-Disposition' ) ) ||
		buildFallbackFilename( params );

	const filename = saveBlob( blob, responseFilename );

	return { filename };
}

/**
 * Extract a filename from a Content-Disposition response header.
 *
 * @param header - Content-Disposition header value.
 * @return The response filename, when present.
 */
export function getFilenameFromContentDisposition( header: string | null ): string | undefined {
	if ( ! header ) {
		return undefined;
	}

	const utf8Match = header.match( /filename\*=UTF-8''([^;]+)/i );
	if ( utf8Match?.[ 1 ] ) {
		try {
			return decodeURIComponent( utf8Match[ 1 ].replace( /(^"|"$)/g, '' ) );
		} catch {
			return undefined;
		}
	}

	const filenameMatch = header.match( /filename="?([^";]+)"?/i );
	return filenameMatch?.[ 1 ];
}

function buildFallbackFilename( params: DownloadReportParams ): string {
	return `${ sanitizeFilenamePart( params.reportType ) }-${ datePart(
		params.from
	) }-to-${ datePart( params.to ) }.csv`;
}

function sanitizeFilenamePart( value: string ): string {
	const sanitized = value
		.trim()
		.toLowerCase()
		.replace( /[^a-z0-9._-]+/g, '-' );
	let start = 0;
	let end = sanitized.length;

	while ( sanitized[ start ] === '-' ) {
		start++;
	}

	while ( end > start && sanitized[ end - 1 ] === '-' ) {
		end--;
	}

	return sanitized.slice( start, end );
}

function datePart( value: string ): string {
	return value.split( 'T' )[ 0 ] || '';
}

async function getResponseErrorMessage( response: Response ): Promise< string > {
	try {
		const body = ( await response.json() ) as { message?: unknown };
		if ( typeof body.message === 'string' && body.message.trim() ) {
			return body.message;
		}
	} catch {
		// Fall through to a status-based error when the response is not JSON.
	}

	return sprintf(
		/* translators: %d: HTTP status code. */
		__( 'Report download failed with status %d.', 'jetpack-premium-analytics-pkg' ),
		response.status
	);
}
