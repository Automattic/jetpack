/**
 * External dependencies
 */
import { useStatsWordAdsEarnings } from '@jetpack-premium-analytics/data';
import { useSectionTab } from '@jetpack-premium-analytics/routing';
import { ReportCsvAction, ReportPageTabs } from '@jetpack-premium-analytics/widgets-toolkit';
import { render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { getNoticeText } from '../../../tests/js/notice-test-utils';
import { useEarningsReportRecords } from './config';
import { useEarningsReportRecords as useRealEarningsReportRecords } from './config/use-report-records';
import EarningsReportPage from './page';
import type { EarningsReportTabId } from './config';
import type { StatsWordAdsEarnings } from '@jetpack-premium-analytics/data';
import type { CsvColumn, EarningsHistoryRow } from '@jetpack-premium-analytics/widgets-toolkit';

// The page gets a stubbed records hook; the hook tests import the real one from its own module.
jest.mock( './config', () => ( {
	...jest.requireActual( './config' ),
	useEarningsReportRecords: jest.fn(),
} ) );

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsWordAdsEarnings: jest.fn(),
} ) );

jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/routing' ),
	useDashboardLink: () => '/',
	useSectionTab: jest.fn(),
} ) );

jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/widgets-toolkit' ),
	ReportCsvAction: jest.fn( () => null ),
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
const reportCsvActionMock = jest.mocked( ReportCsvAction );
const mockUseStatsWordAdsEarnings = jest.mocked( useStatsWordAdsEarnings );

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

/**
 * Read the props the page last passed to its CSV action.
 *
 * @return The CSV action props.
 */
function lastCsvAction() {
	return reportCsvActionMock.mock.lastCall?.[ 0 ] as unknown as {
		columns: CsvColumn< EarningsHistoryRow >[];
		rows: EarningsHistoryRow[];
		filename: string;
	};
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
	} );

	it( 'renders a dash rather than zero when a row has no Ads Served count', () => {
		useRecordsMock.mockReturnValue(
			buildRecords( {
				rows: [ { ...earningsRow, id: '2012-03', period: '2012-03', pageviews: undefined } ],
			} )
		);

		render( <EarningsReportPage /> );

		expect( screen.getByText( '—' ) ).toBeInTheDocument();
		expect( screen.queryByText( '0' ) ).not.toBeInTheDocument();
	} );

	it( 'shows no tab strip when only WordAds has rows', () => {
		useRecordsMock.mockReturnValue( buildRecords( { rows: [ earningsRow ] } ) );

		render( <EarningsReportPage /> );

		expect( reportPageTabsMock ).not.toHaveBeenCalled();
		expect( screen.getByRole( 'heading', { name: 'Earnings history' } ) ).toBeInTheDocument();
	} );

	it( 'offers a tab for each bucket that has rows', () => {
		useRecordsMock.mockReturnValue(
			buildRecords( { rows: [ earningsRow ], availableTabs: [ 'wordads', 'sponsored' ] } )
		);

		render( <EarningsReportPage /> );

		expect( reportPageTabsMock.mock.calls[ 0 ][ 0 ] ).toMatchObject( {
			value: 'wordads',
			tabs: [
				{ id: 'wordads', label: 'Earnings history' },
				{ id: 'sponsored', label: 'Sponsored content history' },
			],
		} );
	} );

	it( 'drops Ads Served on the Adjustments tab', () => {
		useRecordsMock.mockReturnValue(
			buildRecords( {
				tab: 'adjustments',
				rows: [ adjustmentRow ],
				availableTabs: [ 'wordads', 'adjustments' ],
			} )
		);

		render( <EarningsReportPage /> );

		expect( screen.getByRole( 'heading', { name: 'Adjustments history' } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'columnheader', { name: /Ads Served/ } ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'June 2026' ) ).toBeInTheDocument();
		expect( screen.getByText( '-$50.00' ) ).toBeInTheDocument();
	} );

	it( 'replaces stale rows with an error that refetches on Retry', async () => {
		const refetch = jest.fn();
		useRecordsMock.mockReturnValue(
			buildRecords( { rows: [ earningsRow ], isError: true, refetch } )
		);

		render( <EarningsReportPage /> );

		expect(
			getNoticeText( "We couldn't load earnings. Please try again in a moment." )
		).toBeInTheDocument();
		expect( screen.queryByText( 'September 2026' ) ).not.toBeInTheDocument();

		await userEvent.setup().click( screen.getByRole( 'button', { name: 'Retry' } ) );

		expect( refetch ).toHaveBeenCalledTimes( 1 );
	} );

	// Rows arrive oldest-first, as the endpoint's period-keyed payload does, so a
	// missing export sort would ship the table's order reversed.
	it( 'exports the Earnings history newest period first', () => {
		const rows = [
			{ id: '2025-12', period: '2025-12', amount: 10.5, pageviews: 100, status: 1 },
			{ id: '2026-09', period: '2026-09', amount: 30.25, pageviews: 300, status: 0 },
		];
		useRecordsMock.mockReturnValue( buildRecords( { rows } ) );

		render( <EarningsReportPage /> );

		const { columns, rows: exported, filename } = lastCsvAction();
		expect( filename ).toBe( 'earnings-wordads' );
		expect( exported ).toEqual( [ rows[ 1 ], rows[ 0 ] ] );
		expect( columns.map( column => column.getValue( exported[ 0 ] ) ) ).toEqual( [
			'2026-09',
			30.25,
			300,
			'Unpaid',
		] );
	} );

	it( 'exports a pending status with its reason', () => {
		const rows = [ { id: '2026-09', period: '2026-09', amount: 30.25, pageviews: 300, status: 3 } ];
		useRecordsMock.mockReturnValue( buildRecords( { rows } ) );

		render( <EarningsReportPage /> );

		const { columns, rows: exported } = lastCsvAction();
		expect( columns.map( column => column.getValue( exported[ 0 ] ) ) ).toEqual( [
			'2026-09',
			30.25,
			300,
			'Pending (Missing tax info)',
		] );
	} );
} );

const EARNINGS: StatsWordAdsEarnings = {
	total_earnings: 4000,
	total_amount_owed: 1000,
	wordads: {
		'2026-09': { amount: 3889.84, pageviews: 1414489, status: 0 },
		'2026-08': { amount: 3277.37, pageviews: 1365570, status: 1 },
	},
	sponsored: {
		'2026-07': { amount: 12, pageviews: 0, status: 1 },
	},
	adjustment: {
		'2026-06': { amount: -50, pageviews: 0, status: 1 },
	},
};

/**
 * Point the mocked query at a payload.
 *
 * @param data - The earnings payload, or undefined while it loads.
 */
function mockEarnings( data: StatsWordAdsEarnings | undefined ) {
	mockUseStatsWordAdsEarnings.mockReturnValue( {
		data,
		isLoading: false,
		isFetching: false,
		isError: false,
		refetch: jest.fn(),
	} as never );
}

describe( 'useEarningsReportRecords', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'reports the wordads bucket on the WordAds tab', () => {
		mockEarnings( EARNINGS );

		const { result } = renderHook( () => useRealEarningsReportRecords( 'wordads' ) );

		expect( result.current.tab ).toBe( 'wordads' );
		expect( result.current.rows ).toEqual( [
			{ id: '2026-09', period: '2026-09', amount: 3889.84, pageviews: 1414489, status: 0 },
			{ id: '2026-08', period: '2026-08', amount: 3277.37, pageviews: 1365570, status: 1 },
		] );
	} );

	it( 'reports the adjustment bucket on the Adjustments tab', () => {
		mockEarnings( EARNINGS );

		const { result } = renderHook( () => useRealEarningsReportRecords( 'adjustments' ) );

		expect( result.current.tab ).toBe( 'adjustments' );
		expect( result.current.rows ).toEqual( [
			{ id: '2026-06', period: '2026-06', amount: -50, pageviews: 0, status: 1 },
		] );
	} );

	it( 'offers WordAds plus the tabs whose bucket has rows, in tab order', () => {
		mockEarnings( EARNINGS );

		const { result } = renderHook( () => useRealEarningsReportRecords( 'wordads' ) );

		expect( result.current.availableTabs ).toEqual( [ 'wordads', 'sponsored', 'adjustments' ] );
	} );

	it( 'offers WordAds even when only an adjustment bucket has rows', () => {
		mockEarnings( { ...EARNINGS, wordads: {}, sponsored: {} } );

		const { result } = renderHook( () => useRealEarningsReportRecords( 'wordads' ) );

		expect( result.current.availableTabs ).toEqual( [ 'wordads', 'adjustments' ] );
		expect( result.current.tab ).toBe( 'wordads' );
		expect( result.current.rows ).toEqual( [] );
	} );

	it( 'falls back to WordAds when the asked-for bucket is empty', () => {
		mockEarnings( { ...EARNINGS, sponsored: {} } );

		const { result } = renderHook( () => useRealEarningsReportRecords( 'sponsored' ) );

		expect( result.current.tab ).toBe( 'wordads' );
		expect( result.current.rows.map( row => row.period ) ).toEqual( [ '2026-09', '2026-08' ] );
	} );

	it( 'trusts the asked-for tab until the payload arrives', () => {
		mockEarnings( undefined );

		const { result } = renderHook( () => useRealEarningsReportRecords( 'adjustments' ) );

		expect( result.current.tab ).toBe( 'adjustments' );
		expect( result.current.rows ).toEqual( [] );
		expect( result.current.availableTabs ).toEqual( [ 'wordads' ] );
	} );
} );
