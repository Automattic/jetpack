/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import {
	buildReportExportBody,
	downloadReport,
	getFilenameFromContentDisposition,
} from '../report-export-fetch/report-export-fetch';

jest.mock( '@wordpress/api-fetch' );

const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

describe( 'report export downloads', () => {
	const createObjectURL = jest.fn( () => 'blob:report' );
	const revokeObjectURL = jest.fn();
	const click = jest.spyOn( HTMLAnchorElement.prototype, 'click' ).mockImplementation( () => {} );

	beforeEach( () => {
		jest.useFakeTimers();
		Object.defineProperty( window.URL, 'createObjectURL', {
			configurable: true,
			value: createObjectURL,
		} );
		Object.defineProperty( window.URL, 'revokeObjectURL', {
			configurable: true,
			value: revokeObjectURL,
		} );
		jest.clearAllMocks();
	} );

	afterEach( () => {
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
	} );

	afterAll( () => {
		click.mockRestore();
	} );

	it( 'builds a download request for the selected period and comparison', () => {
		expect(
			buildReportExportBody( {
				reportType: 'ordersovertime',
				from: '2026-06-01T00:00:00+02:00',
				to: '2026-06-30T23:59:59+02:00',
				interval: 'day',
				dateType: 'paid',
				compareFrom: '2026-05-01T00:00:00+02:00',
				compareTo: '2026-05-31T23:59:59+02:00',
			} )
		).toEqual( {
			report_type: 'ordersovertime',
			from: '2026-06-01T00:00:00+02:00',
			to: '2026-06-30T23:59:59+02:00',
			interval: 'day',
			delivery_method: 'download',
			date_type: 'paid',
			compare_from: '2026-05-01T00:00:00+02:00',
			compare_to: '2026-05-31T23:59:59+02:00',
		} );
	} );

	it( 'uses the existing endpoint and saves its CSV response', async () => {
		const blob = new Blob( [ 'Date,Orders\n2026-06-01,3' ], { type: 'text/csv' } );
		mockApiFetch.mockResolvedValue( {
			ok: true,
			status: 200,
			headers: new Headers( {
				'Content-Disposition': 'attachment; filename="orders-over-time.csv"',
			} ),
			blob: jest.fn().mockResolvedValue( blob ),
		} as unknown as Response );

		await expect(
			downloadReport( {
				reportType: 'ordersovertime',
				from: '2026-06-01T00:00:00+02:00',
				to: '2026-06-30T23:59:59+02:00',
			} )
		).resolves.toEqual( { filename: 'orders-over-time.csv' } );

		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/jetpack-premium-analytics/v1/reports/csv-export',
			method: 'POST',
			data: {
				report_type: 'ordersovertime',
				from: '2026-06-01T00:00:00+02:00',
				to: '2026-06-30T23:59:59+02:00',
				interval: 'day',
				delivery_method: 'download',
			},
			parse: false,
		} );
		expect( createObjectURL ).toHaveBeenCalledWith( blob );
		expect( click ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'surfaces the error message returned by the export endpoint', async () => {
		mockApiFetch.mockRejectedValue( {
			status: 502,
			json: jest.fn().mockResolvedValue( {
				code: 'api_error',
				message: 'The upstream report API is unavailable.',
			} ),
		} as unknown as Response );

		await expect(
			downloadReport( {
				reportType: 'ordersovertime',
				from: '2026-06-01T00:00:00+02:00',
				to: '2026-06-30T23:59:59+02:00',
			} )
		).rejects.toThrow( 'The upstream report API is unavailable.' );
	} );

	it( 'rethrows a non-Response failure untouched (offline / abort)', async () => {
		// The download button maps this through `getErrorMessage()`, so wrapping it
		// in the response-shaped message would report "status undefined" instead.
		const offline = { code: 'offline_error', message: 'Unable to connect.' };
		mockApiFetch.mockRejectedValue( offline );

		await expect(
			downloadReport( {
				reportType: 'ordersovertime',
				from: '2026-06-01T00:00:00+02:00',
				to: '2026-06-30T23:59:59+02:00',
			} )
		).rejects.toBe( offline );
	} );

	it( 'reads standard and UTF-8 response filenames', () => {
		expect(
			getFilenameFromContentDisposition( 'attachment; filename="orders-over-time.csv"' )
		).toBe( 'orders-over-time.csv' );
		expect(
			getFilenameFromContentDisposition( "attachment; filename*=UTF-8''orders%20over%20time.csv" )
		).toBe( 'orders over time.csv' );
	} );

	it( 'falls back when a UTF-8 response filename has malformed encoding', () => {
		expect(
			getFilenameFromContentDisposition( "attachment; filename*=UTF-8''orders%ZZ.csv" )
		).toBeUndefined();
	} );

	it( 'sanitizes the response filename and normalizes its CSV extension', async () => {
		mockApiFetch.mockResolvedValue( {
			ok: true,
			status: 200,
			headers: new Headers( {
				'Content-Disposition': 'attachment; filename="../orders:report.txt"',
			} ),
			blob: jest.fn().mockResolvedValue( new Blob( [ 'report' ] ) ),
		} as unknown as Response );

		await expect(
			downloadReport( {
				reportType: 'ordersovertime',
				from: '2026-06-01T00:00:00+02:00',
				to: '2026-06-30T23:59:59+02:00',
			} )
		).resolves.toEqual( { filename: '..-orders-report.txt.csv' } );
	} );

	it( 'builds a safe fallback filename without regex backtracking', async () => {
		mockApiFetch.mockResolvedValue( {
			ok: true,
			status: 200,
			headers: new Headers(),
			blob: jest.fn().mockResolvedValue( new Blob( [ 'report' ] ) ),
		} as unknown as Response );

		await expect(
			downloadReport( {
				reportType: `${ '-'.repeat( 10_000 ) }orders${ '-'.repeat( 10_000 ) }`,
				from: '2026-06-01T00:00:00+02:00',
				to: '2026-06-30T23:59:59+02:00',
			} )
		).resolves.toEqual( { filename: 'orders-2026-06-01-to-2026-06-30.csv' } );
	} );
} );
