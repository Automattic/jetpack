/**
 * External dependencies
 */
import { useSectionTab } from '@jetpack-premium-analytics/routing';
import {
	ReportCsvAction,
	useReportCsvExport,
	type CsvColumn,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { render } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useCommentFollowersReportRecords } from './comment-followers/config';
import CommentFollowersReportPage from './comment-followers/page';
import { useEarningsReportRecords } from './earnings/config';
import EarningsReportPage from './earnings/page';
import { useLocationsReportRecords } from './locations/config';
import LocationsReportPage from './locations/page';
import type { ComponentType, ReactNode } from 'react';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	normalizeReportParams: ( search: Record< string, unknown > ) => ( {
		...search,
		interval: 'day',
	} ),
	usePrefetchViewerCountry: () => {},
} ) );

jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/routing' ),
	useDashboardLink: () => '/',
	useReportDateFilters: () => ( {} ),
	useSectionTab: jest.fn(),
} ) );

jest.mock( '@jetpack-premium-analytics/ui', () => ( {
	DateFiltersPanel: () => null,
	StatsBreadcrumbs: () => null,
	StatsPageIcon: () => null,
} ) );

jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => {
	const Container = ( {
		actions,
		children,
		filters,
		tabs,
	}: {
		actions?: ReactNode;
		children?: ReactNode;
		filters?: ReactNode;
		tabs?: ReactNode;
	} ) => (
		<>
			{ actions }
			{ tabs }
			{ filters }
			{ children }
		</>
	);

	return {
		MetricValue: () => null,
		// The real status map, so the Earnings history case asserts the label a
		// reader gets rather than one the mock was told to return.
		getEarningsStatus: jest.requireActual(
			'../../packages/widgets-toolkit/src/components/wordads-earnings-history/fields'
		).getEarningsStatus,
		getWordAdsHistoryFields: () => [],
		ReportCsvAction: jest.fn( () => null ),
		ReportDrilldownTable: () => null,
		ReportErrorState: () => null,
		ReportLocationsMap: () => null,
		ReportPageLayout: Container,
		ReportPageSection: Container,
		ReportPageShell: Container,
		ReportPageTabs: () => null,
		ReportPerformanceChart: () => null,
		ReportRecordsTable: () => null,
		formatLegendLabels: () => ( {} ),
		useReportCsvExport: jest.fn(),
		useReportRetry: ( refetch: () => void ) => refetch,
	};
} );

jest.mock( '@wordpress/admin-ui', () => ( {
	Breadcrumbs: () => null,
	Page: ( { actions, children }: { actions?: ReactNode; children?: ReactNode } ) => (
		<>
			{ actions }
			{ children }
		</>
	),
} ) );

jest.mock( '@wordpress/components', () => ( {
	Spinner: () => null,
} ) );

jest.mock( '@wordpress/route', () => ( {
	Link: ( { children }: { children?: ReactNode } ) => <>{ children }</>,
	useNavigate: () => jest.fn(),
	useSearch: () => ( {} ),
} ) );

// Pages import `EmptyState`/`Text` from the externals passthrough, so the stubs replace them
// there; the Proxy leaves the rest of the barrel intact for other consumers.
jest.mock(
	'@jetpack-premium-analytics/externals',
	() =>
		new Proxy(
			{
				EmptyState: {
					Root: ( { children }: { children?: ReactNode } ) => <>{ children }</>,
					Title: ( { children }: { children?: ReactNode } ) => <>{ children }</>,
				},
				Text: ( { children }: { children?: ReactNode } ) => <>{ children }</>,
			},
			{
				get: ( overrides, prop ) =>
					prop in overrides
						? overrides[ prop as keyof typeof overrides ]
						: jest.requireActual( '@jetpack-premium-analytics/externals' )[ prop ],
			}
		)
);

jest.mock( './earnings/config', () => ( {
	getEarningsReportTabs: () => [ { id: 'wordads', label: 'Earnings history' } ],
	getTabLabel: ( id: string ) => ( id === 'wordads' ? 'Earnings history' : id ),
	resolveSection: ( value: string | undefined ) => value ?? 'wordads',
	useEarningsReportRecords: jest.fn(),
} ) );

jest.mock( './comment-followers/config', () => ( {
	getCommentFollowersFields: () => [],
	useCommentFollowersReportRecords: jest.fn(),
} ) );

jest.mock( './locations/config', () => ( {
	GEO_MODES: jest.requireActual( './locations/config' ).GEO_MODES,
	getLocationFields: () => [],
	getReportLocationsTabs: () => [ { id: 'countries', label: 'Countries' } ],
	getTabLabel: ( id: string ) => ( id === 'countries' ? 'Countries' : id ),
	resolveSection: ( value: string | undefined ) => value ?? 'countries',
	supportsCountryFilter: ( tab: string ) => tab !== 'countries',
	useLocationsReportRecords: jest.fn(),
} ) );

const useCommentFollowersReportRecordsMock = jest.mocked( useCommentFollowersReportRecords );
const useEarningsReportRecordsMock = jest.mocked( useEarningsReportRecords );
const useLocationsReportRecordsMock = jest.mocked( useLocationsReportRecords );
const useSectionTabMock = jest.mocked( useSectionTab );
const useReportCsvExportMock = jest.mocked( useReportCsvExport );
const reportCsvActionMock = jest.mocked( ReportCsvAction );

const reportStatus = {
	isLoading: false,
	isFetching: false,
	isError: false,
	refetch: jest.fn(),
};

type ExportOptions = {
	rows: unknown[];
	filenamePrefix: string;
	sort?: ( a: never, b: never ) => number;
};

type ExportActionProps = {
	columns: CsvColumn< unknown >[];
	rows: unknown[];
	filename: string;
};

/**
 * Render a report and assert the values passed to its CSV action.
 *
 * @param Page           - Report page component.
 * @param filenamePrefix - Expected filename prefix.
 * @param expectedRows   - Expected sorted export rows.
 * @param expectedValues - Expected CSV values for the first row.
 */
function expectCsvExport(
	Page: ComponentType,
	filenamePrefix: string,
	expectedRows: unknown[],
	expectedValues: unknown[]
) {
	render( <Page /> );

	const exportOptions = useReportCsvExportMock.mock.calls.at( -1 )?.[ 0 ] as ExportOptions;
	expect( exportOptions.filenamePrefix ).toBe( filenamePrefix );

	const actionProps = reportCsvActionMock.mock.calls.at( -1 )?.[ 0 ] as ExportActionProps;
	expect( actionProps.rows ).toEqual( expectedRows );
	expect( actionProps.filename ).toBe( 'report.csv' );
	expect( actionProps.columns.map( column => column.getValue( actionProps.rows[ 0 ] ) ) ).toEqual(
		expectedValues
	);
}

/* eslint-disable jest/expect-expect -- Assertions are centralized in expectCsvExport. */
describe( 'report CSV exports', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		useSectionTabMock.mockReturnValue( [ 'authors', jest.fn() ] as ReturnType<
			typeof useSectionTab
		> );
		useReportCsvExportMock.mockImplementation( options => {
			const rows = options.sort ? [ ...options.rows ].sort( options.sort ) : options.rows;

			return {
				canExport: true,
				rows,
				filename: 'report.csv',
			};
		} );
	} );

	// Rows arrive oldest-first, as the endpoint's period-keyed payload does, so a
	// missing export sort would ship the table's order reversed.
	it( 'configures the Earnings history export, newest period first', () => {
		const rows = [
			{ id: '2025-12', period: '2025-12', amount: 10.5, pageviews: 100, status: 1 },
			{ id: '2026-09', period: '2026-09', amount: 30.25, pageviews: 300, status: 0 },
		];
		useEarningsReportRecordsMock.mockReturnValue( {
			...reportStatus,
			tab: 'wordads',
			availableTabs: [ 'wordads' ],
			rows,
		} as ReturnType< typeof useEarningsReportRecords > );

		expectCsvExport(
			EarningsReportPage,
			'earnings-wordads',
			[ rows[ 1 ], rows[ 0 ] ],
			[ '2026-09', 30.25, 300, 'Unpaid' ]
		);
	} );

	it( 'exports a pending status with its reason', () => {
		const rows = [ { id: '2026-09', period: '2026-09', amount: 30.25, pageviews: 300, status: 3 } ];
		useEarningsReportRecordsMock.mockReturnValue( {
			...reportStatus,
			tab: 'wordads',
			availableTabs: [ 'wordads' ],
			rows,
		} as ReturnType< typeof useEarningsReportRecords > );

		expectCsvExport( EarningsReportPage, 'earnings-wordads', rows, [
			'2026-09',
			30.25,
			300,
			'Pending (Missing tax info)',
		] );
	} );

	it( 'configures the Comments Subscribers export', () => {
		const rows = [
			{ id: 1, label: 'First post', followers: 2, link: '/first', value: 2, children: null },
			{ id: 2, label: 'Second post', followers: 5, link: '/second', value: 5, children: null },
		];
		useCommentFollowersReportRecordsMock.mockReturnValue( {
			...reportStatus,
			allPostsFollowers: 7,
			rows,
		} as ReturnType< typeof useCommentFollowersReportRecords > );

		expectCsvExport(
			CommentFollowersReportPage,
			'comment-subscribers',
			[ rows[ 1 ], rows[ 0 ] ],
			[ 'Second post', 5, '/second' ]
		);
	} );

	it( 'configures the Locations export', () => {
		const rows = [
			{ id: 'IN:India', label: 'India', countryCode: 'IN', countryFull: 'India', views: 2 },
			{
				id: 'AU:Australia',
				label: 'Australia',
				countryCode: 'AU',
				countryFull: 'Australia',
				views: 5,
			},
		];
		useSectionTabMock.mockReturnValue( [ 'countries', jest.fn() ] as unknown as ReturnType<
			typeof useSectionTab
		> );
		useLocationsReportRecordsMock.mockReturnValue( {
			...reportStatus,
			hasComparison: false,
			countries: { options: [] },
			table: {
				...reportStatus,
				rows,
			},
		} as unknown as ReturnType< typeof useLocationsReportRecords > );

		expectCsvExport(
			LocationsReportPage,
			'locations-countries',
			[ rows[ 1 ], rows[ 0 ] ],
			[ 'Australia', 5 ]
		);
	} );
} );
