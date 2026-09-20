/**
 * External dependencies
 */
import { useSectionTab } from '@jetpack-premium-analytics/routing';
import { ReportPageTabs } from '@jetpack-premium-analytics/widgets-toolkit';
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useEarningsReportRecords } from './config';
import EarningsReportPage from './page';
import type { EarningsReportTabId } from './config';
import type { EarningsHistoryRow } from '@jetpack-premium-analytics/widgets-toolkit';

jest.mock( './config', () => ( {
	...jest.requireActual( './config' ),
	useEarningsReportRecords: jest.fn(),
} ) );

jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/routing' ),
	useDashboardLink: () => '/',
	useSectionTab: jest.fn(),
} ) );

jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/widgets-toolkit' ),
	ReportPageTabs: jest.fn( () => null ),
} ) );

// `Breadcrumbs` reaches for router context this page-level test has no need to provide.
jest.mock( '@wordpress/admin-ui', () => ( {
	...jest.requireActual( '@wordpress/admin-ui' ),
	Breadcrumbs: () => null,
} ) );

const useRecordsMock = jest.mocked( useEarningsReportRecords );
const useSectionTabMock = jest.mocked( useSectionTab );
const reportPageTabsMock = jest.mocked( ReportPageTabs );

const earningsRow: EarningsHistoryRow = {
	id: '2026-09',
	period: '2026-09',
	amount: 3889.84,
	pageviews: 1414489,
	status: 0,
};

const adjustmentRow: EarningsHistoryRow = {
	id: '2026-06',
	period: '2026-06',
	amount: -50,
	pageviews: 0,
	status: 1,
};

/**
 * Build a records-hook return value for the page under test.
 *
 * @param overrides - The fields to override on the successful-empty default.
 * @return The mocked hook result.
 */
function buildRecords( overrides: Partial< ReturnType< typeof useEarningsReportRecords > > ) {
	return {
		tab: 'wordads' as EarningsReportTabId,
		rows: [],
		availableTabs: [ 'wordads' as EarningsReportTabId ],
		isLoading: false,
		isFetching: false,
		isError: false,
		refetch: jest.fn(),
		...overrides,
	} as ReturnType< typeof useEarningsReportRecords >;
}

describe( 'EarningsReportPage', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		useSectionTabMock.mockReturnValue( [ 'wordads', jest.fn() ] as ReturnType<
			typeof useSectionTab
		> );
	} );

	it( 'renders a period with its earnings, ads served, and status label', () => {
		useRecordsMock.mockReturnValue( buildRecords( { rows: [ earningsRow ] } ) );

		render( <EarningsReportPage /> );

		expect( screen.getByRole( 'columnheader', { name: /Ads Served/ } ) ).toBeInTheDocument();
		expect( screen.getByText( 'September 2026' ) ).toBeInTheDocument();
		expect( screen.getByText( '1,414,489' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Unpaid' ) ).toBeInTheDocument();
		expect( screen.getByText( /Ads Served is the number of ads/ ) ).toBeInTheDocument();
	} );

	it( 'shows no tab strip when only WordAds has rows', () => {
		useRecordsMock.mockReturnValue( buildRecords( { rows: [ earningsRow ] } ) );

		render( <EarningsReportPage /> );

		expect( reportPageTabsMock ).not.toHaveBeenCalled();
		expect(
			screen.getByRole( 'heading', { name: 'Earnings history report' } )
		).toBeInTheDocument();
	} );

	it( 'offers a tab for each bucket that has rows', () => {
		useRecordsMock.mockReturnValue(
			buildRecords( { rows: [ earningsRow ], availableTabs: [ 'wordads', 'adjustments' ] } )
		);

		render( <EarningsReportPage /> );

		expect( reportPageTabsMock.mock.calls[ 0 ][ 0 ] ).toMatchObject( {
			value: 'wordads',
			tabs: [
				{ id: 'wordads', label: 'Earnings history' },
				{ id: 'adjustments', label: 'Adjustments history' },
			],
		} );
	} );

	it( 'drops Ads Served and its note on the Adjustments tab', () => {
		useRecordsMock.mockReturnValue(
			buildRecords( {
				tab: 'adjustments',
				rows: [ adjustmentRow ],
				availableTabs: [ 'wordads', 'adjustments' ],
			} )
		);

		render( <EarningsReportPage /> );

		expect(
			screen.getByRole( 'heading', { name: 'Adjustments history report' } )
		).toBeInTheDocument();
		expect( screen.queryByRole( 'columnheader', { name: /Ads Served/ } ) ).not.toBeInTheDocument();
		expect( screen.queryByText( /Ads Served is the number of ads/ ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'June 2026' ) ).toBeInTheDocument();
		expect( screen.getByText( '-$50.00' ) ).toBeInTheDocument();
	} );

	it( 'surfaces the error and retry instead of stale rows', () => {
		useRecordsMock.mockReturnValue( buildRecords( { rows: [ earningsRow ], isError: true } ) );

		render( <EarningsReportPage /> );

		expect( screen.getByText( 'Unable to load earnings' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Retry' } ) ).toBeInTheDocument();
		expect( screen.queryByText( 'September 2026' ) ).not.toBeInTheDocument();
	} );
} );
