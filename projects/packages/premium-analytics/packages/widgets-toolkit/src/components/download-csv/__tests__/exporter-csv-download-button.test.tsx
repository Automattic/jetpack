/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { downloadReportCsv } from '../../../report-exports/download-report-csv';
import { WidgetRootContext } from '../../widget-root';
import { ExporterCsvDownloadButton } from '../exporter-csv-download-button';
import type { ReportCsvExporter } from '../../../report-exports/types';
import type { ReportParams } from '@jetpack-premium-analytics/data';

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

function renderButton( status = SETTLED, rowCount = 3 ) {
	return render(
		<WidgetRootContext.Provider value={ { reportParams: REPORT_PARAMS } }>
			<ExporterCsvDownloadButton exporter={ exporter } status={ status } rowCount={ rowCount } />
		</WidgetRootContext.Provider>
	);
}

describe( 'ExporterCsvDownloadButton', () => {
	beforeEach( () => {
		jest.useFakeTimers();
		jest.clearAllMocks();
		mockGetScriptData.mockReturnValue( undefined );
		mockDownloadReportCsv.mockResolvedValue( undefined );
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'downloads the full report for the widget report window', async () => {
		renderButton();

		// This package does not depend on @testing-library/user-event.
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByRole( 'button', { name: /Download CSV/ } ) );

		await waitFor( () =>
			expect( mockDownloadReportCsv ).toHaveBeenCalledWith( exporter, REPORT_PARAMS )
		);
	} );

	it.each( [
		[ 'no rows', SETTLED, 0 ],
		[ 'loading', { ...SETTLED, isLoading: true }, 3 ],
		[ 'fetching a new range', { ...SETTLED, isFetching: true }, 3 ],
		[ 'failed', { ...SETTLED, isError: true }, 3 ],
	] )( 'stays hidden while the widget has %s', ( _state, status, rowCount ) => {
		renderButton( status, rowCount );

		expect( screen.queryByRole( 'button', { name: /Download CSV/ } ) ).not.toBeInTheDocument();
	} );

	it( 'stays hidden when the server disables CSV exports', () => {
		mockGetScriptData.mockReturnValue( {
			premium_analytics: { csv_exports_enabled: false },
		} as ReturnType< typeof getScriptData > );

		renderButton();

		expect( screen.queryByRole( 'button', { name: /Download CSV/ } ) ).not.toBeInTheDocument();
	} );
} );
