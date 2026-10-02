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

	it( 'reports a failed download itself instead of rejecting to the action runner', async () => {
		jest.mocked( downloadReportCsv ).mockRejectedValue( new Error( 'Upstream API unavailable.' ) );
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
		jest.mocked( downloadReportCsv ).mockReturnValue(
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

	it( 'stops holding the button once a failed download settles', async () => {
		jest.mocked( downloadReportCsv ).mockRejectedValue( new Error( 'Upstream API unavailable.' ) );
		const { result, rerender } = renderHook(
			( { status } ) => useExporterCsvAction( { exporter, status, rowCount: 3 } ),
			{ wrapper, initialProps: { status: SETTLED } }
		);

		await act( () => result.current.callback() );
		rerender( { status: { ...SETTLED, isFetching: true } } );
		expect( result.current ).toBeNull();
	} );
} );
