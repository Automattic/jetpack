/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useEarningsReportRecords } from './config';
import EarningsReportPage from './page';
import type { EarningsHistoryRow } from '@jetpack-premium-analytics/widgets-toolkit';

jest.mock( './config', () => ( {
	...jest.requireActual( './config' ),
	useEarningsReportRecords: jest.fn(),
} ) );

jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/routing' ),
	useDashboardLink: () => '/',
} ) );

// `Breadcrumbs` reaches for router context this page-level test has no need to provide.
jest.mock( '@wordpress/admin-ui', () => ( {
	...jest.requireActual( '@wordpress/admin-ui' ),
	Breadcrumbs: () => null,
} ) );

const useRecordsMock = jest.mocked( useEarningsReportRecords );

const earningsRow: EarningsHistoryRow = {
	id: '2026-09',
	period: '2026-09',
	amount: 3889.84,
	pageviews: 1414489,
	status: 0,
};

/**
 * Build a records-hook return value for the page under test.
 *
 * @param overrides - The fields to override on the successful-empty default.
 * @return The mocked hook result.
 */
function buildRecords( overrides: Partial< ReturnType< typeof useEarningsReportRecords > > ) {
	return {
		rows: [],
		isLoading: false,
		isFetching: false,
		isError: false,
		refetch: jest.fn(),
		...overrides,
	} as ReturnType< typeof useEarningsReportRecords >;
}

describe( 'EarningsReportPage', () => {
	it( 'renders a period with its earnings, ads served, and status label', () => {
		useRecordsMock.mockReturnValue( buildRecords( { rows: [ earningsRow ] } ) );

		render( <EarningsReportPage /> );

		expect( screen.getByRole( 'columnheader', { name: /Ads Served/ } ) ).toBeInTheDocument();
		expect( screen.getByText( '09-2026' ) ).toBeInTheDocument();
		expect( screen.getByText( '1,414,489' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Unpaid' ) ).toBeInTheDocument();
	} );

	it( 'surfaces the error and retry instead of stale rows', () => {
		useRecordsMock.mockReturnValue( buildRecords( { rows: [ earningsRow ], isError: true } ) );

		render( <EarningsReportPage /> );

		expect( screen.getByText( 'Unable to load earnings' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Retry' } ) ).toBeInTheDocument();
		expect( screen.queryByText( '09-2026' ) ).not.toBeInTheDocument();
	} );
} );
