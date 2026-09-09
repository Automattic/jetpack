/**
 * External dependencies
 */
import { useStatsPost } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import PostAllTimeTrafficRender from '../render';
import type { HeatmapColumn } from '@jetpack-premium-analytics/widgets-toolkit';
import type { ReactNode } from 'react';

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

// The click lands in the page's date-filter controller, so a recorder stands in for it.
const mockOnChange = jest.fn();
const mockOnApply = jest.fn();
jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	useReportDateFilters: () => ( {
		onChange: ( ...args: unknown[] ) => mockOnChange( ...args ),
		onApply: () => mockOnApply(),
		timeZone: 'UTC',
	} ),
} ) );

// Keep visx out of jsdom while keeping the cell markup the widget reads: a grid
// naming its selected cell, and one `gridcell` per month carrying its indexes.
jest.mock( '@jetpack-premium-analytics/externals', () => {
	const actual = jest.requireActual( '@jetpack-premium-analytics/externals' );

	const HeatmapChart = ( {
		data,
		rowLabels = [],
		children,
	}: {
		data: HeatmapColumn[];
		rowLabels?: string[];
		children?: ReactNode;
	} ) => (
		<div
			role="grid"
			tabIndex={ 0 }
			aria-label="heatmap"
			aria-activedescendant="cell-10-1"
			data-testid="heatmap"
			data-column-labels={ data.map( column => column.label ).join( '|' ) }
			data-row-labels={ rowLabels.join( '|' ) }
			// One entry per row: its twelve months, `.` for filler, `x` for no views, `-` for a blank one.
			data-rows={ rowLabels
				.map( ( _label, row ) =>
					data
						.map( column => {
							const cell = column.data[ row ];

							if ( cell?.placeholder ) {
								return '.';
							}

							if ( cell?.hidden ) {
								return '-';
							}

							return cell?.value === null ? 'x' : cell?.value;
						} )
						.join( ',' )
				)
				.join( '|' ) }
		>
			{ rowLabels.map( ( rowLabel, row ) =>
				data.map( ( column, columnIndex ) =>
					column.data[ row ]?.hidden || column.data[ row ]?.placeholder ? null : (
						<div
							key={ `${ columnIndex }-${ row }` }
							id={ `cell-${ columnIndex }-${ row }` }
							role="gridcell"
							tabIndex={ -1 }
							aria-label={ `${ column.label } ${ rowLabel }` }
							data-column={ columnIndex }
							data-row={ row }
						>
							{ column.data[ row ]?.value }
						</div>
					)
				)
			) }
			{ children }
		</div>
	);
	HeatmapChart.Legend = ( { lessLabel, moreLabel }: { lessLabel: string; moreLabel: string } ) => (
		<div data-testid="legend">{ `${ lessLabel }/${ moreLabel }` }</div>
	);

	return { ...actual, HeatmapChart };
} );

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsPost: jest.fn(),
} ) );

const mockUseStatsPost = jest.mocked( useStatsPost );

function statsPostResult( data: unknown, overrides: Record< string, unknown > = {} ) {
	return {
		data,
		isLoading: false,
		isFetching: false,
		isError: false,
		error: null,
		refetch: jest.fn(),
		...overrides,
	} as unknown as ReturnType< typeof useStatsPost >;
}

const RESPONSE = {
	years: {
		'2025': { total: 30, months: { '11': 10, '12': 20 } },
		'2026': { total: 45, months: { '1': 5, '3': 40 } },
	},
	post: { ID: 779, post_date: '2025-11-10 16:27:32' },
};

const NOVEMBER_2025 = {
	from: new Date( '2025-11-10T00:00:00.000Z' ),
	to: new Date( '2025-11-30T23:59:59.999Z' ),
};

// The current year closes the table, so the clock is pinned: the rows are 2026 and 2025.
const NOW = new Date( '2026-03-15T12:00:00.000Z' );

// `null` renders the widget without a post scope.
function renderWidget( postId: number | null = 779 ) {
	return render(
		<PostAllTimeTrafficRender
			attributes={ {
				reportParams: {
					from: '2026-01-01T00:00:00.000+00:00',
					to: '2026-01-31T23:59:59.999+00:00',
					...( postId === null ? {} : { post_id: postId } ),
				},
			} }
		/>
	);
}

describe( 'PostAllTimeTraffic widget', () => {
	beforeEach( () => {
		mockOnChange.mockReset();
		mockOnApply.mockReset();
		mockUseStatsPost.mockReset();
		mockUseStatsPost.mockReturnValue( statsPostResult( RESPONSE ) );
		jest.useFakeTimers();
		jest.setSystemTime( NOW );
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'lays the years out newest first over the site month names', () => {
		renderWidget();

		const heatmap = screen.getByTestId( 'heatmap' );
		expect( heatmap ).toHaveAttribute( 'data-row-labels', '2026|2025' );
		expect( heatmap.dataset.columnLabels?.split( '|' ) ).toHaveLength( 12 );
		// The current year runs on to the clock's month, so only its opening is pinned.
		const rows = heatmap.dataset.rows?.split( '|' ) ?? [];
		// February had no views: a zero, as the endpoint reports it.
		expect( rows[ 0 ]?.startsWith( '5,0,40' ) ).toBe( true );
		// The months still to come are filler too, so the row stays a whole year.
		expect( rows[ 0 ]?.split( ',' ) ).toHaveLength( 12 );
		expect( rows[ 0 ] ).not.toContain( '-' );
		// Published in November: the months before it are filler.
		expect( rows[ 1 ] ).toBe( '.,.,.,.,.,.,.,.,.,.,10,20' );
		expect( screen.getByTestId( 'legend' ) ).toHaveTextContent( 'Fewer views/More views' );
	} );

	it( 'applies a clicked month to the page as a custom range cut to the post life', async () => {
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		renderWidget();

		await user.click( screen.getByRole( 'gridcell', { name: 'Nov 2025' } ) );

		expect( mockOnChange ).toHaveBeenCalledWith( NOVEMBER_2025, 'custom' );
		expect( mockOnApply ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'opens the keyboard-selected month on Enter', async () => {
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		renderWidget();

		screen.getByRole( 'grid', { name: 'heatmap' } ).focus();
		await user.keyboard( '{Enter}' );

		expect( mockOnChange ).toHaveBeenCalledWith( NOVEMBER_2025, 'custom' );
		expect( mockOnApply ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'opens the keyboard-selected month on Enter after a click left the focus on a cell', async () => {
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		renderWidget();

		screen.getByRole( 'gridcell', { name: 'Nov 2025' } ).focus();
		await user.keyboard( '{Enter}' );

		expect( mockOnChange ).toHaveBeenCalledWith( NOVEMBER_2025, 'custom' );
	} );

	it( 'leaves the page alone for keys that do not activate', async () => {
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		renderWidget();

		screen.getByRole( 'grid', { name: 'heatmap' } ).focus();
		await user.keyboard( '{ArrowRight}' );

		expect( mockOnChange ).not.toHaveBeenCalled();
	} );

	it( 'shows the scopeless empty state without a post', () => {
		mockUseStatsPost.mockReturnValue( statsPostResult( undefined ) );
		renderWidget( null );

		expect(
			screen.getByText( 'Open a post or page report to see its all-time traffic here.' )
		).toBeInTheDocument();
		expect( mockUseStatsPost ).toHaveBeenCalledWith( expect.objectContaining( { postId: 0 } ) );
	} );

	it( 'reports a post with no views as empty', () => {
		mockUseStatsPost.mockReturnValue( statsPostResult( { years: {}, post: { ID: 779 } } ) );
		renderWidget();

		expect( screen.getByText( 'No views yet.' ) ).toBeInTheDocument();
	} );

	it( 'offers a retry when the request fails with nothing on screen', async () => {
		const refetch = jest.fn();
		mockUseStatsPost.mockReturnValue(
			statsPostResult( undefined, { isError: true, error: new Error( 'boom' ), refetch } )
		);
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		renderWidget();

		expect(
			screen.getByText( "We couldn't load this post's traffic. Please try again in a moment." )
		).toBeInTheDocument();
		await user.click( screen.getByRole( 'button', { name: 'Retry' } ) );
		expect( refetch ).toHaveBeenCalledTimes( 1 );
	} );
} );
