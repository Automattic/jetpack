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
import { DownloadCsvButton } from '../download-csv-button';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: jest.fn(),
} ) );
jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	downloadReport: jest.fn(),
} ) );

const mockGetScriptData = getScriptData as jest.Mock;
const mockDownloadReport = downloadReport as jest.MockedFunction< typeof downloadReport >;

describe( 'DownloadCsvButton', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockGetScriptData.mockReturnValue( {
			premium_analytics: { client_side_csv_exports_enabled: true },
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
			premium_analytics: { client_side_csv_exports_enabled: false },
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
} );
