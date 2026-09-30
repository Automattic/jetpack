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
import { FullReportCsvDownloadButton } from '../full-report-csv-download-button';
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

const exporter = {
	filenamePrefix: 'things',
	hasDateRange: true,
	fetchItems: jest.fn(),
	toCsvRows: jest.fn(),
	getColumns: jest.fn(),
} as unknown as ReportCsvExporter< unknown, unknown >;

function renderButton( isReady: boolean ) {
	return render(
		<WidgetRootContext.Provider value={ { reportParams: REPORT_PARAMS } }>
			<FullReportCsvDownloadButton exporter={ exporter } isReady={ isReady } />
		</WidgetRootContext.Provider>
	);
}

describe( 'FullReportCsvDownloadButton', () => {
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
		renderButton( true );

		// This package does not depend on @testing-library/user-event.
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByRole( 'button', { name: /Download CSV/ } ) );

		await waitFor( () =>
			expect( mockDownloadReportCsv ).toHaveBeenCalledWith( exporter, REPORT_PARAMS )
		);
	} );

	it( 'stays hidden until the widget has rows to back it', () => {
		renderButton( false );

		expect( screen.queryByRole( 'button', { name: /Download CSV/ } ) ).not.toBeInTheDocument();
	} );

	it( 'stays hidden when the server disables CSV exports', () => {
		mockGetScriptData.mockReturnValue( {
			premium_analytics: { csv_exports_enabled: false },
		} as ReturnType< typeof getScriptData > );

		renderButton( true );

		expect( screen.queryByRole( 'button', { name: /Download CSV/ } ) ).not.toBeInTheDocument();
	} );
} );
