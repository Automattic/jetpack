/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { downloadReport } from '@jetpack-premium-analytics/data';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { WidgetRootContext } from '../../widget-root';
import { ReportCsvDownloadButton } from '../report-csv-download-button';

jest.mock(
	'@automattic/jetpack-script-data',
	() =>
		jest.requireActual( '../../../../../../tests/js/script-data-test-utils' ).mockJetpackScriptData
);
jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	downloadReport: jest.fn(),
} ) );

const mockDownloadReport = jest.mocked( downloadReport );
const mockGetScriptData = jest.mocked( getScriptData );

describe( 'ReportCsvDownloadButton', () => {
	beforeEach( () => {
		jest.useFakeTimers();
		jest.clearAllMocks();
		mockGetScriptData.mockReturnValue( undefined );
		mockDownloadReport.mockResolvedValue( { filename: 'orders-over-time.csv' } );
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'downloads using report parameters from WidgetRoot', async () => {
		render(
			<WidgetRootContext.Provider
				value={ { reportParams: { from: '2026-06-01', to: '2026-06-30', interval: 'day' } } }
			>
				<ReportCsvDownloadButton reportType="ordersovertime" />
			</WidgetRootContext.Provider>
		);

		const button = screen.getByRole( 'button', { name: /Download CSV/ } );
		// This package does not depend on @testing-library/user-event.
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( button );

		expect( mockDownloadReport ).toHaveBeenCalledWith( {
			reportType: 'ordersovertime',
			from: '2026-06-01',
			to: '2026-06-30',
			interval: 'day',
		} );
		await waitFor( () => expect( button ).not.toHaveAttribute( 'aria-disabled', 'true' ) );
	} );

	it( 'accepts explicit report parameters without WidgetRoot', async () => {
		render(
			<ReportCsvDownloadButton
				reportType="ordersovertime"
				reportParams={ {
					from: '2026-06-01T00:00:00+02:00',
					to: '2026-06-30T23:59:59+02:00',
					interval: 'day',
				} }
			/>
		);

		const button = screen.getByRole( 'button', { name: /Download CSV/ } );
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( button );

		expect( mockDownloadReport ).toHaveBeenCalledTimes( 1 );
		await waitFor( () => expect( button ).not.toHaveAttribute( 'aria-disabled', 'true' ) );
	} );

	it( 'stays hidden when the server disables CSV exports', () => {
		mockGetScriptData.mockReturnValue( {
			premium_analytics: {
				initial_full_sync_finished: 1,
				csv_exports_enabled: false,
			},
		} as ReturnType< typeof getScriptData > );

		render(
			<ReportCsvDownloadButton
				reportType="ordersovertime"
				reportParams={ {
					from: '2026-06-01T00:00:00+02:00',
					to: '2026-06-30T23:59:59+02:00',
					interval: 'day',
				} }
			/>
		);

		expect( screen.queryByRole( 'button', { name: /Download CSV/ } ) ).not.toBeInTheDocument();
	} );

	it( 'fails gracefully when report parameters are unavailable', () => {
		const warn = jest.spyOn( console, 'warn' ).mockImplementation( () => {} );

		render( <ReportCsvDownloadButton reportType="ordersovertime" /> );

		expect( screen.queryByRole( 'button', { name: /Download CSV/ } ) ).not.toBeInTheDocument();
		expect( warn ).toHaveBeenCalledWith(
			'useServerReportCsvAction requires reportParams or a surrounding WidgetRoot.'
		);

		warn.mockRestore();
	} );
} );
