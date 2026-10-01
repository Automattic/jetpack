/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { act, renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { downloadReportCsv } from '../../../report-exports/download-report-csv';
import { WidgetRootContext } from '../../widget-root';
import { useExporterCsvAction } from '../csv-download-action';
import type { ReportCsvExporter } from '../../../report-exports/types';
import type { ReportParams } from '@jetpack-premium-analytics/data';
import type { ReactNode } from 'react';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: jest.fn(),
} ) );
jest.mock( '../../../report-exports/download-report-csv', () => ( {
	downloadReportCsv: jest.fn(),
} ) );

const mockDownloadReportCsv = jest.mocked( downloadReportCsv );

const REPORT_PARAMS = { from: '2026-03-01', to: '2026-03-10', interval: 'day' } as ReportParams;
const SETTLED = { isLoading: false, isFetching: false, isError: false };
const exporter = { filenamePrefix: 'things' } as ReportCsvExporter< unknown, unknown >;

const wrapper = ( { children }: { children: ReactNode } ) => (
	<WidgetRootContext.Provider value={ { reportParams: REPORT_PARAMS } }>
		{ children }
	</WidgetRootContext.Provider>
);

describe( 'useExporterCsvAction', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		jest.mocked( getScriptData ).mockReturnValue( undefined );
	} );

	it( 'describes the download as a callback action for the widget report window', async () => {
		mockDownloadReportCsv.mockResolvedValue( undefined );
		const { result } = renderHook(
			() => useExporterCsvAction( { exporter, status: SETTLED, rowCount: 3 } ),
			{ wrapper }
		);

		expect( result.current ).toMatchObject( { id: 'download-csv', label: 'Download CSV' } );
		expect( result.current?.icon ).toBeTruthy();

		await act( () => result.current?.callback() );
		expect( mockDownloadReportCsv ).toHaveBeenCalledWith( exporter, REPORT_PARAMS );
	} );

	it( 'leaves a failed download for the renderer to report', async () => {
		mockDownloadReportCsv.mockRejectedValue( new Error( 'Upstream API unavailable.' ) );
		const { result } = renderHook(
			() => useExporterCsvAction( { exporter, status: SETTLED, rowCount: 3 } ),
			{ wrapper }
		);

		await act( () =>
			expect( result.current?.callback() ).rejects.toThrow( 'Upstream API unavailable.' )
		);
	} );

	it( 'returns null until the widget has settled rows', () => {
		const { result } = renderHook(
			() =>
				useExporterCsvAction( { exporter, status: { ...SETTLED, isFetching: true }, rowCount: 3 } ),
			{ wrapper }
		);

		expect( result.current ).toBeNull();
	} );

	// The widget's query can share the download's cache key, so the download itself
	// can set `isFetching`; unmounting the button then would drop focus mid-download.
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
		expect( result.current ).toBeNull();
	} );
} );
