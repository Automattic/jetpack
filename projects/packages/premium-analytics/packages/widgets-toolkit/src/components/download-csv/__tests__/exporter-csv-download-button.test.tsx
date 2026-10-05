/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { downloadReportCsv } from '../../../report-exports/download-report-csv';
import { WidgetRootContext } from '../../widget-root';
import { useExporterCsvAction } from '../csv-download-action';
import { ExporterCsvDownloadButton } from '../exporter-csv-download-button';
import type { ReportCsvExporter } from '../../../report-exports/types';
import type { ReportParams } from '@jetpack-premium-analytics/data';
import type { ReactNode } from 'react';

const mockCreateErrorNotice = jest.fn();

jest.mock(
	'@wordpress/data',
	() =>
		new Proxy(
			{
				useRegistry: () => ( {
					dispatch: () => ( { createErrorNotice: mockCreateErrorNotice } ),
				} ),
			},
			{
				get: ( overrides, prop ) =>
					prop in overrides
						? overrides[ prop as keyof typeof overrides ]
						: jest.requireActual( '@wordpress/data' )[ prop ],
			}
		)
);
jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: jest.fn(),
} ) );
jest.mock( '../../../report-exports/download-report-csv', () => ( {
	downloadReportCsv: jest.fn(),
} ) );

const mockGetScriptData = jest.mocked( getScriptData );
const mockDownloadReportCsv = jest.mocked( downloadReportCsv );

const REPORT_PARAMS = { from: '2026-03-01', to: '2026-03-10', interval: 'day' } as ReportParams;
const SETTLED = { isLoading: false, isFetching: false, isError: false };

const exporter = {
	filenamePrefix: 'things',
	hasDateRange: true,
	fetchItems: jest.fn(),
	toCsvRows: jest.fn(),
	getColumns: jest.fn(),
} as unknown as ReportCsvExporter< unknown, unknown >;

const wrapper = ( { children }: { children: ReactNode } ) => (
	<WidgetRootContext.Provider value={ { reportParams: REPORT_PARAMS } }>
		{ children }
	</WidgetRootContext.Provider>
);

beforeEach( () => {
	jest.clearAllMocks();
	mockGetScriptData.mockReturnValue( undefined );
} );

describe( 'useExporterCsvAction', () => {
	it( 'reports a failed download itself instead of rejecting to the action runner', async () => {
		mockDownloadReportCsv.mockRejectedValue( new Error( 'Upstream API unavailable.' ) );
		const { result } = renderHook(
			() => useExporterCsvAction( { exporter, status: SETTLED, rowCount: 3 } ),
			{ wrapper }
		);

		await act( () => expect( result.current?.callback() ).resolves.toBeUndefined() );
		expect( mockCreateErrorNotice ).toHaveBeenCalledWith( 'Upstream API unavailable.', {
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

describe( 'ExporterCsvDownloadButton', () => {
	beforeEach( () => {
		jest.useFakeTimers();
		mockDownloadReportCsv.mockResolvedValue( undefined );
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	function renderButton( status = SETTLED, rowCount = 3 ) {
		return render(
			<ExporterCsvDownloadButton exporter={ exporter } status={ status } rowCount={ rowCount } />,
			{ wrapper }
		);
	}

	it( 'downloads the full report for the widget report window', async () => {
		renderButton();

		const button = screen.getByRole( 'button', { name: /Download CSV/ } );
		// This package does not depend on @testing-library/user-event.
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( button );

		expect( mockDownloadReportCsv ).toHaveBeenCalledWith( exporter, REPORT_PARAMS );
		await waitFor( () => expect( button ).not.toHaveAttribute( 'aria-disabled', 'true' ) );
	} );

	// The full readiness matrix lives with `isReportCsvReady`; these rows prove the button reads it.
	it.each( [
		[ 'no rows', SETTLED, 0 ],
		[ 'fetching a new range', { ...SETTLED, isFetching: true }, 3 ],
	] )( 'stays hidden while the widget has %s', ( _state, status, rowCount ) => {
		renderButton( status, rowCount );

		expect( screen.queryByRole( 'button', { name: /Download CSV/ } ) ).not.toBeInTheDocument();
	} );
} );
