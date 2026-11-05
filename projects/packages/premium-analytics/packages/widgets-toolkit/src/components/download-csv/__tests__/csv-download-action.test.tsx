/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { act, renderHook } from '@testing-library/react';
import { RegistryProvider } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { createNoticesRegistry } from '../../../../../../tests/js/notice-test-utils';
import * as downloadReportCsvModule from '../../../report-exports/download-report-csv';
import { WidgetRootContext } from '../../widget-root';
import { useExporterCsvAction } from '../csv-download-action';
import type { ReportCsvExporter } from '../../../report-exports/types';
import type { ReportParams } from '@jetpack-premium-analytics/data';
import type { ReactNode } from 'react';

jest.mock(
	'@automattic/jetpack-script-data',
	() =>
		jest.requireActual( '../../../../../../tests/js/script-data-test-utils' ).mockJetpackScriptData
);
jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	downloadReport: jest.fn(),
} ) );

const mockGetScriptData = jest.mocked( getScriptData );

const { registry, createErrorNotice } = createNoticesRegistry();

let mockDownloadReportCsv: jest.SpiedFunction< typeof downloadReportCsvModule.downloadReportCsv >;

function setUp() {
	jest.clearAllMocks();
	mockGetScriptData.mockReturnValue( undefined );
	mockDownloadReportCsv = jest.spyOn( downloadReportCsvModule, 'downloadReportCsv' );
}

const REPORT_PARAMS = { from: '2026-03-01', to: '2026-03-10', interval: 'day' } as ReportParams;
const SETTLED = { isLoading: false, isFetching: false, isError: false };

const exporter = {
	filenamePrefix: 'things',
	hasDateRange: true,
	fetchItems: jest.fn(),
	toCsvRows: jest.fn(),
	getColumns: jest.fn(),
} as unknown as ReportCsvExporter< unknown, unknown >;

function wrapper( { children }: { children: ReactNode } ) {
	return (
		<RegistryProvider value={ registry }>
			<WidgetRootContext.Provider value={ { reportParams: REPORT_PARAMS } }>
				{ children }
			</WidgetRootContext.Provider>
		</RegistryProvider>
	);
}

describe( 'useExporterCsvAction', () => {
	beforeEach( setUp );

	afterEach( () => {
		mockDownloadReportCsv.mockRestore();
	} );

	it( 'reports a failed download itself instead of rejecting to the action runner', async () => {
		mockDownloadReportCsv.mockRejectedValue( new Error( 'Upstream API unavailable.' ) );
		const { result } = renderHook(
			() => useExporterCsvAction( { exporter, status: SETTLED, rowCount: 3 } ),
			{ wrapper }
		);

		await act( () => expect( result.current?.callback() ).resolves.toBeUndefined() );
		expect( createErrorNotice ).toHaveBeenCalledWith( 'Upstream API unavailable.', {
			type: 'snackbar',
			explicitDismiss: true,
		} );
	} );

	it( 'stays available while its own download refetches the widget query', async () => {
		let finishDownload: () => void = () => {};
		mockDownloadReportCsv.mockReturnValue(
			new Promise< void >( resolve => {
				finishDownload = resolve;
			} )
		);
		const { result, rerender } = renderHook(
			( { status } ) => useExporterCsvAction( { exporter, status, rowCount: 3 } ),
			{ wrapper, initialProps: { status: SETTLED } }
		);

		let download: Promise< unknown >;
		act( () => {
			download = result.current.callback();
		} );
		rerender( { status: { ...SETTLED, isFetching: true } } );
		expect( result.current ).not.toBeNull();

		await act( async () => {
			finishDownload();
			await download;
		} );
		rerender( { status: { ...SETTLED, isError: true } } );
		expect( result.current ).toBeNull();
	} );

	it( 'holds the button until the widget refetch settles after a failed download', async () => {
		let failDownload: ( error: Error ) => void = () => {};
		mockDownloadReportCsv.mockReturnValue(
			new Promise< void >( ( _resolve, reject ) => {
				failDownload = reject;
			} )
		);
		const { result, rerender } = renderHook(
			( { status } ) => useExporterCsvAction( { exporter, status, rowCount: 3 } ),
			{ wrapper, initialProps: { status: SETTLED } }
		);

		let download: Promise< unknown >;
		act( () => {
			download = result.current.callback();
		} );
		rerender( { status: { ...SETTLED, isFetching: true } } );

		await act( async () => {
			failDownload( new Error( 'Upstream API unavailable.' ) );
			await download;
		} );
		expect( result.current ).not.toBeNull();

		rerender( { status: { ...SETTLED, isError: true } } );
		expect( result.current ).toBeNull();
	} );
} );
