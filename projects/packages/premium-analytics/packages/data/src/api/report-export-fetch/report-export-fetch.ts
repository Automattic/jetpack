/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { __, sprintf } from '@wordpress/i18n';

const REPORT_DOWNLOAD_PATH = '/jetpack-premium-analytics/v1/reports/csv-export';

type ApiFetchOptions = Parameters< typeof apiFetch >[ 0 ] & {
	parse?: boolean;
};

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

export interface DownloadReportParams extends Omit< ExportReportParams, 'reportType' > {
	reportType: string;
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

export interface DownloadReportResponse {
	filename: string;
}

type ReportExportBody = {
	report_type: string;
	from: string;
	to: string;
	interval: string;
	delivery_method: 'download';
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
 * Request a browser download from the existing WooCommerce Analytics CSV endpoint.
 *
 * @param params - Export parameters.
 * @return The filename used for the downloaded CSV.
 */
export async function downloadReport(
	params: DownloadReportParams
): Promise< DownloadReportResponse > {
	const response = ( await apiFetch( {
		path: REPORT_DOWNLOAD_PATH,
		method: 'POST',
		data: buildReportExportBody( params ),
		parse: false,
	} as ApiFetchOptions ) ) as Response;

	if ( ! response.ok ) {
		throw new Error(
			sprintf(
				/* translators: %d: HTTP status code. */
				__( 'Report download failed with status %d.', 'jetpack-premium-analytics' ),
				response.status
			)
		);
	}

	const blob = await response.blob();
	const filename =
		getFilenameFromContentDisposition( response.headers.get( 'Content-Disposition' ) ) ||
		buildFallbackFilename( params );

	saveBlob( blob, filename );

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
		return decodeURIComponent( utf8Match[ 1 ].replace( /(^"|"$)/g, '' ) );
	}

	const filenameMatch = header.match( /filename="?([^";]+)"?/i );
	return filenameMatch?.[ 1 ];
}

/**
 * Save a response blob as a browser download.
 *
 * @param blob     - Blob returned by the export endpoint.
 * @param filename - Download filename.
 */
export function saveBlob( blob: Blob, filename: string ): void {
	const url = window.URL.createObjectURL( blob );
	const link = document.createElement( 'a' );

	link.href = url;
	link.download = filename;
	link.style.display = 'none';

	document.body.appendChild( link );
	link.click();
	document.body.removeChild( link );

	setTimeout( () => window.URL.revokeObjectURL( url ), 0 );
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
