/**
 * External dependencies
 */
import {
	ExporterCsvAction,
	ReportRecordsTable,
	videosCsvExporter,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { getNoticeText } from '../../../tests/js/notice-test-utils';
import {
	getVideosFields,
	isVideoRowClickable,
	renderVideoRowLink,
	useVideosReportRecords,
} from './config';
import VideosReportPage from './page';
import type { StatsVideoPlaysComparisonItem } from '@jetpack-premium-analytics/data';
import type { ReactNode } from 'react';

jest.mock( './config', () => ( {
	getVideosFields: jest.fn( () => [] ),
	isVideoRowClickable: jest.requireActual( './config' ).isVideoRowClickable,
	renderVideoRowLink: jest.requireActual( './config' ).renderVideoRowLink,
	useVideosReportRecords: jest.fn(),
} ) );

jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/routing' ),
	useDashboardLink: () => '/',
	useReportDateFilters: () => ( {} ),
} ) );

jest.mock( '@jetpack-premium-analytics/ui', () => ( {
	DateFiltersPanel: () => null,
	StatsBreadcrumbs: () => null,
	StatsPageIcon: () => null,
} ) );

jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	PageNotice: jest.requireActual( '@jetpack-premium-analytics/widgets-toolkit' ).PageNotice,
	describeError: jest.requireActual( '@jetpack-premium-analytics/widgets-toolkit' ).describeError,
	ReportPageLayout: ( { children }: { children: ReactNode } ) => <>{ children }</>,
	ReportPageShell: ( { actions, children }: { actions?: ReactNode; children: ReactNode } ) => (
		<>
			{ actions ? <div data-testid="page-actions">{ actions }</div> : null }
			{ children }
		</>
	),
	ReportRecordsTable: jest.fn( () => null ),
	ExporterCsvAction: jest.fn( () => <button>Download</button> ),
	videosCsvExporter: jest.requireActual( '@jetpack-premium-analytics/widgets-toolkit' )
		.videosCsvExporter,
	useReportRetry: ( refetch: () => unknown ) => () => {
		void refetch();
	},
} ) );

jest.mock( '@wordpress/admin-ui', () => ( {
	Breadcrumbs: () => null,
} ) );

jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {
		from: '2026-06-01T00:00:00+02:00',
		to: '2026-06-30T23:59:59+02:00',
		interval: 'day',
	} ),
} ) );

const useRecordsMock = jest.mocked( useVideosReportRecords );
const exporterCsvActionMock = jest.mocked( ExporterCsvAction );
const getVideosFieldsMock = jest.mocked( getVideosFields );
const reportRecordsTableMock = jest.mocked( ReportRecordsTable );

const videoRow = {
	id: 7,
	label: 'Settled video',
	plays: 3,
	impressions: 9,
	watch_time: 0.5,
	retention_rate: 40,
	link: null,
	children: null,
} satisfies StatsVideoPlaysComparisonItem;

/**
 * Build the report records used by the page test.
 *
 * @param overrides - The fields to override on the settled one-row default.
 * @return The mocked records hook result.
 */
function buildRecords( overrides: Partial< ReturnType< typeof useVideosReportRecords > > = {} ) {
	return {
		isError: false,
		refetch: jest.fn(),
		rows: [ videoRow ],
		hasComparison: false,
		isLoading: false,
		isFetching: false,
		...overrides,
	} as ReturnType< typeof useVideosReportRecords >;
}

describe( 'VideosReportPage', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'draws each video poster beside its title, linked to the detail page', () => {
		getVideosFieldsMock.mockImplementationOnce(
			jest.requireActual< typeof import( './config' ) >( './config' ).getVideosFields
		);
		useRecordsMock.mockReturnValue( buildRecords() );

		render( <VideosReportPage /> );

		const { initialView, isItemClickable, renderItemLink } =
			reportRecordsTableMock.mock.calls[ 0 ][ 0 ];
		expect( initialView ).toMatchObject( { titleField: 'label', mediaField: 'poster' } );
		expect( isItemClickable ).toBe( isVideoRowClickable );
		expect( renderItemLink ).toBe( renderVideoRowLink );
	} );

	it( 'exports the report rows for the selected range', () => {
		const rows = [
			{
				id: 441,
				label: 'Demo',
				plays: 13,
				impressions: 22,
				watch_time: 0.04,
				retention_rate: 64.5,
				link: 'https://example.com/video/441',
				children: null,
			},
		];
		const records = buildRecords( { rows } );
		useRecordsMock.mockReturnValue( records );

		render( <VideosReportPage /> );

		expect( exporterCsvActionMock.mock.calls[ 0 ][ 0 ] ).toEqual(
			expect.objectContaining( {
				exporter: videosCsvExporter,
				items: rows,
				status: records,
				reportParams: expect.objectContaining( {
					from: '2026-06-01T00:00:00+02:00',
					to: '2026-06-30T23:59:59+02:00',
				} ),
			} )
		);
	} );

	it( 'enables comparison fields when matching comparison rows are available', () => {
		useRecordsMock.mockReturnValue( buildRecords( { hasComparison: true } ) );

		render( <VideosReportPage /> );

		expect( getVideosFieldsMock ).toHaveBeenCalledWith( true );
	} );

	it( 'keeps the rows on screen while a changed range is fetching', () => {
		// `placeholderData` keeps rows mounted through a date/comparison refetch — clearing them
		// would drop the user's search, sort, and page position mid-refetch.
		const rows = [
			{
				id: 12,
				label: 'Old range video',
				plays: 11,
				impressions: 42,
				watch_time: 128.5,
				retention_rate: 61.25,
				link: null,
				children: null,
			},
		] satisfies StatsVideoPlaysComparisonItem[];
		useRecordsMock.mockReturnValue( buildRecords( { rows, isFetching: true } ) );

		render( <VideosReportPage /> );

		expect( reportRecordsTableMock.mock.calls[ 0 ][ 0 ] ).toEqual(
			expect.objectContaining( {
				data: rows,
				isLoading: false,
				isFetching: true,
			} )
		);
	} );

	it( 'provides stable row ids for videos without a numeric id', () => {
		useRecordsMock.mockReturnValue( buildRecords() );

		render( <VideosReportPage /> );

		const getItemId = reportRecordsTableMock.mock.calls[ 0 ][ 0 ].getItemId as (
			item: StatsVideoPlaysComparisonItem
		) => string;
		const video = {
			id: undefined,
			label: 'Launch video',
			plays: 0,
			impressions: 0,
			watch_time: 0,
			retention_rate: 0,
			link: 'https://example.com/video/',
			children: null,
		} satisfies StatsVideoPlaysComparisonItem;

		expect( getItemId( video ) ).toBe( 'https://example.com/video/' );
		expect( getItemId( { ...video, link: null } ) ).toBe( 'video:Launch video' );
		expect( getItemId( { ...video, label: '', link: null } ) ).toBe( 'video:unknown' );
	} );

	it( 'replaces the table with an error that refetches on Retry', async () => {
		const records = buildRecords( { isError: true } );
		useRecordsMock.mockReturnValue( records );

		render( <VideosReportPage /> );

		expect(
			getNoticeText( "We couldn't load videos. Please try again in a moment." )
		).toBeInTheDocument();
		expect( reportRecordsTableMock ).not.toHaveBeenCalled();

		await userEvent.setup().click( screen.getByRole( 'button', { name: 'Retry' } ) );

		expect( records.refetch ).toHaveBeenCalledTimes( 1 );
	} );
} );
