/**
 * External dependencies
 */
import {
	PeriodChangeSignalProvider,
	postSurface,
	useSettlePeriodChange,
	useStatsPost,
} from '@jetpack-premium-analytics/data';
import { createTZDateFromParts, endOfDayTZ } from '@jetpack-premium-analytics/datetime';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import PostAllTimeTrafficRender from '../render';

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

// The chart's responsive wrapper asks for a ResizeObserver jsdom does not have.
class ResizeObserverStub {
	observe() {}
	unobserve() {}
	disconnect() {}
}

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsPost: jest.fn(),
} ) );

// The page's scroll area is the layout's; a recorder stands in for it.
const mockScrollToTop = jest.fn();
jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/widgets-toolkit' ),
	useDetailPageScrollToTop: () => mockScrollToTop,
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
	averages: {
		'2025': { overall: 1, months: { '11': 1, '12': 2 } },
		'2026': { overall: 3, months: { '1': 1, '3': 8 } },
	},
	post: { ID: 779, post_date: '2025-11-10 16:27:32' },
};

const NOVEMBER_2025 = {
	from: createTZDateFromParts( [ 2025, 10, 10 ], 'UTC' ),
	to: endOfDayTZ( createTZDateFromParts( [ 2025, 10, 30 ], 'UTC' ), 'UTC' ),
};

// The current year closes the table, so the clock is pinned: the rows are 2026 and 2025.
const NOW = new Date( '2026-03-15T12:00:00.000Z' );

// `null` renders the widget without a post scope.
function renderWidget( postId: number | null = 779, attributes: Record< string, unknown > = {} ) {
	return render(
		<PostAllTimeTrafficRender
			attributes={ {
				...attributes,
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
	beforeAll( () => {
		( globalThis as { ResizeObserver?: unknown } ).ResizeObserver = ResizeObserverStub;
	} );

	beforeEach( () => {
		mockOnChange.mockReset();
		mockOnApply.mockReset();
		mockScrollToTop.mockReset();
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

		const grid = screen.getByRole( 'grid' );
		expect( grid ).toHaveAttribute( 'aria-rowcount', '2' );
		// Twelve months and the Totals roll-up.
		expect( grid ).toHaveAttribute( 'aria-colcount', '13' );
		expect( screen.getByRole( 'gridcell', { name: 'Jan 2026: 5' } ) ).toHaveAttribute(
			'data-row',
			'0'
		);
		// February had no views: a zero, as the endpoint reports it.
		expect( screen.getByRole( 'gridcell', { name: 'Feb 2026: 0' } ) ).toBeInTheDocument();
		// The months still to come, and the months before the post was published, are filler.
		expect( screen.queryByRole( 'gridcell', { name: /Apr 2026/ } ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'gridcell', { name: /Oct 2025/ } ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'gridcell', { name: 'Nov 2025: 10' } ) ).toHaveAttribute(
			'data-row',
			'1'
		);
		expect( screen.getByRole( 'gridcell', { name: 'Totals 2025: 30' } ) ).toBeInTheDocument();
		expect( screen.getByText( 'Fewer views' ) ).toBeInTheDocument();
		expect( screen.getByText( 'More views' ) ).toBeInTheDocument();
	} );

	it( 'draws views per day under the average metric', () => {
		renderWidget( 779, { metric: 'average' } );

		expect( screen.getByRole( 'gridcell', { name: 'Mar 2026: 8' } ) ).toBeInTheDocument();
		expect( screen.getByText( 'Fewer views per day' ) ).toBeInTheDocument();
		expect( screen.getByText( 'More views per day' ) ).toBeInTheDocument();
	} );

	it( 'applies a clicked year total to the page as the year cut to the post life', async () => {
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		renderWidget();

		await user.click( screen.getByRole( 'gridcell', { name: 'Totals 2025: 30' } ) );

		expect( mockOnChange ).toHaveBeenCalledWith(
			{
				from: new Date( '2025-11-10T00:00:00.000Z' ),
				to: new Date( '2025-12-31T23:59:59.999Z' ),
			},
			'custom',
			{ exactRange: true }
		);
		expect( mockOnApply ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'applies a clicked month to the page as a custom range cut to the post life', async () => {
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		renderWidget();

		await user.click( screen.getByRole( 'gridcell', { name: 'Nov 2025: 10' } ) );

		expect( mockOnChange ).toHaveBeenCalledWith( NOVEMBER_2025, 'custom', { exactRange: true } );
		expect( mockOnApply ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'signals the period change to the page it is on', async () => {
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		function DateControlProbe() {
			const attentionId = useSettlePeriodChange( postSurface( 779 ), NOVEMBER_2025, true );

			return <output>{ attentionId ?? 'none' }</output>;
		}
		render(
			<PeriodChangeSignalProvider>
				<DateControlProbe />
				<PostAllTimeTrafficRender
					attributes={ {
						reportParams: {
							from: '2026-01-01T00:00:00.000+00:00',
							to: '2026-01-31T23:59:59.999+00:00',
							post_id: 779,
						},
					} }
				/>
			</PeriodChangeSignalProvider>
		);

		await user.click( screen.getByRole( 'gridcell', { name: 'Nov 2025: 10' } ) );

		expect( screen.getByRole( 'status' ) ).not.toHaveTextContent( 'none' );
	} );

	it( 'brings the page back to the top once the month is applied', async () => {
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		renderWidget();

		await user.click( screen.getByRole( 'gridcell', { name: 'Nov 2025: 10' } ) );

		expect( mockScrollToTop ).toHaveBeenCalledTimes( 1 );
		expect( mockScrollToTop.mock.invocationCallOrder[ 0 ] ).toBeGreaterThan(
			mockOnApply.mock.invocationCallOrder[ 0 ]
		);
	} );

	it( 'opens a month the endpoint reports before the publish day in full', async () => {
		mockUseStatsPost.mockReturnValue(
			statsPostResult( { ...RESPONSE, post: { ID: 779, post_date: '2026-01-10 16:27:32' } } )
		);
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		renderWidget();

		await user.click( screen.getByRole( 'gridcell', { name: 'Nov 2025: 10' } ) );

		expect( mockOnChange ).toHaveBeenCalledWith(
			{
				from: new Date( '2025-11-01T00:00:00.000Z' ),
				to: new Date( '2025-11-30T23:59:59.999Z' ),
			},
			'custom',
			{ exactRange: true }
		);
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
