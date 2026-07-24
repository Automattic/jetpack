/**
 * External dependencies
 */
import { ReportErrorState, ReportRecordsTable } from '@jetpack-premium-analytics/widgets-toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { getVideosFields, useVideosReportRecords } from './config';
import VideosReportPage from './page';
import type { StatsVideoPlaysComparisonItem } from '@jetpack-premium-analytics/data';
import type { ReactNode } from 'react';

jest.mock( './config', () => ( {
	getVideosFields: jest.fn( () => [] ),
	useVideosReportRecords: jest.fn(),
} ) );

jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	useDashboardLink: () => '/',
	useReportDateFilters: () => ( {} ),
} ) );

jest.mock( '@jetpack-premium-analytics/ui', () => ( {
	DateFiltersPanel: () => null,
} ) );

jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	ReportErrorState: jest.fn( ( { title, onRetry }: { title: string; onRetry: () => void } ) => (
		<div data-testid="report-error-state">
			<span>{ title }</span>
			<button onClick={ onRetry }>Retry</button>
		</div>
	) ),
	ReportPageLayout: ( { children }: { children: ReactNode } ) => <>{ children }</>,
	ReportPageShell: ( { children }: { children: ReactNode } ) => <>{ children }</>,
	ReportRecordsTable: jest.fn( () => null ),
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
const getVideosFieldsMock = jest.mocked( getVideosFields );
const reportErrorStateMock = jest.mocked( ReportErrorState );
const reportRecordsTableMock = jest.mocked( ReportRecordsTable );

/**
 * Build the report records used by the page test.
 *
 * @param overrides - The fields to override on the successful-empty default.
 * @return The mocked records hook result.
 */
function buildRecords( overrides: Partial< ReturnType< typeof useVideosReportRecords > > = {} ) {
	return {
		isError: false,
		refetch: jest.fn(),
		rows: [],
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

	it( 'renders the records table when the report succeeds', () => {
		useRecordsMock.mockReturnValue( buildRecords() );

		render( <VideosReportPage /> );

		expect( reportRecordsTableMock ).toHaveBeenCalled();
		expect( reportErrorStateMock ).not.toHaveBeenCalled();
	} );

	it( 'enables comparison fields when matching comparison rows are available', () => {
		useRecordsMock.mockReturnValue( buildRecords( { hasComparison: true } ) );

		render( <VideosReportPage /> );

		expect( getVideosFieldsMock ).toHaveBeenCalledWith( true );
	} );

	it( 'hides stale rows and loads the table while a changed range is fetching', () => {
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
				data: [],
				isLoading: true,
			} )
		);
	} );

	it( 'passes ready rows to the table after loading and fetching complete', () => {
		const rows = [
			{
				id: 12,
				label: 'Current range video',
				plays: 11,
				impressions: 42,
				watch_time: 128.5,
				retention_rate: 61.25,
				link: null,
				children: null,
			},
		] satisfies StatsVideoPlaysComparisonItem[];
		useRecordsMock.mockReturnValue( buildRecords( { rows } ) );

		render( <VideosReportPage /> );

		expect( reportRecordsTableMock.mock.calls[ 0 ][ 0 ] ).toEqual(
			expect.objectContaining( {
				data: rows,
				isLoading: false,
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

	it( 'renders the error state instead of the records table', () => {
		useRecordsMock.mockReturnValue( buildRecords( { isError: true } ) );

		render( <VideosReportPage /> );

		expect( screen.getByTestId( 'report-error-state' ) ).toHaveTextContent(
			'Unable to load videos'
		);
		expect( reportRecordsTableMock ).not.toHaveBeenCalled();
	} );

	it( 'refetches the report when Retry is clicked', async () => {
		const records = buildRecords( { isError: true } );
		useRecordsMock.mockReturnValue( records );

		render( <VideosReportPage /> );
		await userEvent.setup().click( screen.getByRole( 'button', { name: 'Retry' } ) );

		expect( records.refetch ).toHaveBeenCalledTimes( 1 );
	} );
} );
