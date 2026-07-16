/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { downloadReport } from '@jetpack-premium-analytics/data';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { buildCsv, saveCsv } from '../../../helpers/build-csv';
import { WidgetRootContext } from '../../widget-root';
import { DownloadCsvButton } from '../download-csv-button';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: jest.fn(),
} ) );
jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	downloadReport: jest.fn(),
} ) );
jest.mock( '../../../helpers/build-csv', () => ( {
	buildCsv: jest.fn( () => '"Title"\n"Hello"' ),
	saveCsv: jest.fn(),
} ) );

const mockGetScriptData = getScriptData as jest.Mock;
const mockDownloadReport = downloadReport as jest.MockedFunction< typeof downloadReport >;
const mockBuildCsv = buildCsv as jest.MockedFunction< typeof buildCsv >;
const mockSaveCsv = saveCsv as jest.MockedFunction< typeof saveCsv >;

describe( 'DownloadCsvButton', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockGetScriptData.mockReturnValue( {
			premium_analytics: { csv_exports_enabled: true },
		} );
		mockDownloadReport.mockResolvedValue( { filename: 'orders-over-time.csv' } );
	} );

	it( 'uses the report endpoint when a supported report type is provided', async () => {
		render(
			<WidgetRootContext.Provider
				value={ {
					reportParams: {
						from: '2026-06-01T00:00:00+02:00',
						to: '2026-06-30T23:59:59+02:00',
						interval: 'day',
						comp: '1',
						compare_from: '2026-05-01T00:00:00+02:00',
						compare_to: '2026-05-31T23:59:59+02:00',
					},
				} }
			>
				<DownloadCsvButton reportType="ordersovertime" />
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
				compareFrom: '2026-05-01T00:00:00+02:00',
				compareTo: '2026-05-31T23:59:59+02:00',
			} )
		);
	} );

	it( 'stays hidden while the proof-of-concept flag is disabled', () => {
		mockGetScriptData.mockReturnValue( {
			premium_analytics: { csv_exports_enabled: false },
		} );

		render(
			<WidgetRootContext.Provider
				value={ {
					reportParams: {
						from: '2026-06-01T00:00:00+02:00',
						to: '2026-06-30T23:59:59+02:00',
						interval: 'day',
					},
				} }
			>
				<DownloadCsvButton reportType="ordersovertime" />
			</WidgetRootContext.Provider>
		);

		expect( screen.queryByRole( 'button', { name: /Download CSV/ } ) ).not.toBeInTheDocument();
	} );

	it( 'disables client-side exports until the browser download handoff completes', async () => {
		const rows = [ { title: 'Hello' } ];
		const columns = [ { key: 'title' as const, label: 'Title' } ];

		render( <DownloadCsvButton columns={ columns } rows={ rows } filename="top-posts" /> );

		const button = screen.getByRole( 'button', { name: /Download CSV/ } );
		// This package does not depend on @testing-library/user-event.
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( button );

		expect( button ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( mockSaveCsv ).not.toHaveBeenCalled();
		await waitFor( () => expect( mockBuildCsv ).toHaveBeenCalledWith( columns, rows ) );
		expect( mockSaveCsv ).toHaveBeenCalledWith( 'top-posts', '"Title"\n"Hello"' );
		await waitFor( () => expect( button ).not.toHaveAttribute( 'aria-disabled', 'true' ) );
	} );

	it( 'shows server download failures without replacing the download action', async () => {
		mockDownloadReport.mockRejectedValueOnce( new Error( 'Upstream API unavailable.' ) );

		render(
			<WidgetRootContext.Provider
				value={ {
					reportParams: {
						from: '2026-06-01T00:00:00+02:00',
						to: '2026-06-30T23:59:59+02:00',
						interval: 'day',
					},
				} }
			>
				<DownloadCsvButton reportType="ordersovertime" />
			</WidgetRootContext.Provider>
		);

		// This package does not depend on @testing-library/user-event.
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByRole( 'button', { name: /Download CSV/ } ) );

		await expect(
			screen.findByText( 'Upstream API unavailable.', { selector: 'span' } )
		).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: /Download CSV/ } ) ).toBeInTheDocument();
	} );

	it( 'fails gracefully when server mode has no report params', () => {
		const warn = jest.spyOn( console, 'warn' ).mockImplementation( () => {} );

		render( <DownloadCsvButton reportType="ordersovertime" /> );

		expect( screen.queryByRole( 'button', { name: /Download CSV/ } ) ).not.toBeInTheDocument();
		expect( warn ).toHaveBeenCalledWith(
			'DownloadCsvButton server mode requires reportParams or a surrounding WidgetRoot.'
		);

		warn.mockRestore();
	} );

	it( 'disables the button while a server download is in progress', async () => {
		let resolveDownload: ( value: { filename: string } ) => void = () => {};
		mockDownloadReport.mockImplementationOnce(
			() =>
				new Promise( resolve => {
					resolveDownload = resolve;
				} )
		);

		render(
			<WidgetRootContext.Provider
				value={ {
					reportParams: {
						from: '2026-06-01T00:00:00+02:00',
						to: '2026-06-30T23:59:59+02:00',
						interval: 'day',
					},
				} }
			>
				<DownloadCsvButton reportType="ordersovertime" />
			</WidgetRootContext.Provider>
		);

		const button = screen.getByRole( 'button', { name: /Download CSV/ } );
		// This package does not depend on @testing-library/user-event.
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( button );

		await waitFor( () => expect( button ).toHaveAttribute( 'aria-disabled', 'true' ) );
		await act( async () => resolveDownload( { filename: 'orders-over-time.csv' } ) );
		await waitFor( () => expect( button ).not.toHaveAttribute( 'aria-disabled', 'true' ) );
	} );

	it( 'accepts explicit report params without a WidgetRoot context', async () => {
		render(
			<DownloadCsvButton
				reportType="ordersovertime"
				reportParams={ {
					from: '2026-06-01T00:00:00+02:00',
					to: '2026-06-30T23:59:59+02:00',
					interval: 'day',
				} }
			/>
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
			} )
		);
	} );
} );
