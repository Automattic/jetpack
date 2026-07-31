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

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: jest.fn(),
} ) );
jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	downloadReport: jest.fn(),
} ) );

const mockDownloadReport = jest.mocked( downloadReport );
const mockGetScriptData = jest.mocked( getScriptData );

describe( 'ReportCsvDownloadButton', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockGetScriptData.mockReturnValue( undefined );
		mockDownloadReport.mockResolvedValue( { filename: 'orders-over-time.csv' } );
	} );

	it( 'downloads using report parameters from WidgetRoot', async () => {
		render(
			<WidgetRootContext.Provider
				value={ {
					reportParams: {
						from: '2026-06-01T00:00:00+02:00',
						to: '2026-06-30T23:59:59+02:00',
						interval: 'day',
						date_type: 'paid',
						comp: '1',
						compare_from: '2026-05-01T00:00:00+02:00',
						compare_to: '2026-05-31T23:59:59+02:00',
					},
				} }
			>
				<ReportCsvDownloadButton reportType="ordersovertime" />
			</WidgetRootContext.Provider>
		);

		// This package does not depend on @testing-library/user-event.
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByRole( 'button', { name: /Download CSV/ } ) );

		await waitFor( () =>
			expect( mockDownloadReport ).toHaveBeenCalledWith( {
				reportType: 'ordersovertime',
				from: '2026-06-01T00:00:00+02:00',
				to: '2026-06-30T23:59:59+02:00',
				interval: 'day',
				dateType: 'paid',
				compareFrom: '2026-05-01T00:00:00+02:00',
				compareTo: '2026-05-31T23:59:59+02:00',
			} )
		);
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

		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByRole( 'button', { name: /Download CSV/ } ) );

		await waitFor( () => expect( mockDownloadReport ).toHaveBeenCalledTimes( 1 ) );
	} );

	it( 'stays hidden when the server disables CSV exports', () => {
		mockGetScriptData.mockReturnValue( {
			premium_analytics: {
				initial_full_sync_finished: 1,
				has_store_data: false,
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
			'ReportCsvDownloadButton requires reportParams or a surrounding WidgetRoot.'
		);

		warn.mockRestore();
	} );
} );
