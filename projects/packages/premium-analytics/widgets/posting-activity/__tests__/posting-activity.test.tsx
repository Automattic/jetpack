/**
 * External dependencies
 */
import { useStatsStreak } from '@jetpack-premium-analytics/data';
import { fireEvent, render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import PostingActivityRender from '../render';
import type { ReportParams } from '@jetpack-premium-analytics/data';
import type { HeatmapTooltipData } from '@jetpack-premium-analytics/widgets-toolkit';
import type { ReactNode } from 'react';

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

jest.mock( '@jetpack-premium-analytics/externals', () => {
	const actual = jest.requireActual( '@jetpack-premium-analytics/externals' );

	return {
		...actual,
		// Render the widget's own tooltip too: after the shared `CalendarHeatmapTooltip`
		// landed, the copy each widget passes in is the only part still its own.
		HeatmapChartUnresponsive: ( {
			data,
			width,
			renderTooltip,
		}: {
			data?: { data: { label?: string; value: number | null; placeholder?: boolean }[] }[];
			width?: number;
			renderTooltip?: ( data: HeatmapTooltipData ) => ReactNode;
		} ) => (
			<>
				<div
					data-testid="heatmap"
					data-columns={ data?.length }
					data-width={ String( width ) }
					data-day-values={ data
						?.flatMap( column => column.data )
						.filter( cell => cell.value !== null )
						.map( cell => `${ cell.label }:${ cell.value }` )
						.join( '|' ) }
					data-placeholders={ String(
						data?.flatMap( column => column.data ).filter( cell => cell.placeholder ).length
					) }
				/>
				<div data-testid="tooltip-empty">
					{ renderTooltip?.( { value: null, cellLabel: 'Mon, Jun 2, 2025', row: 0, column: 0 } ) }
				</div>
				<div data-testid="tooltip-singular">
					{ renderTooltip?.( { value: 1, cellLabel: 'Tue, Jun 3, 2025', row: 1, column: 0 } ) }
				</div>
				<div data-testid="tooltip-plural">
					{ renderTooltip?.( { value: 3, cellLabel: 'Wed, Jun 4, 2025', row: 2, column: 0 } ) }
				</div>
			</>
		),
	};
} );

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsStreak: jest.fn(),
} ) );

const mockUseStatsStreak = jest.mocked( useStatsStreak );
const REPORT_PARAMS = {
	from: '2025-06-01',
	to: '2025-06-30',
	interval: 'day',
} as unknown as ReportParams;

function streakResult( overrides: Record< string, unknown > = {} ) {
	return {
		data: { '2025-06-02': 1 },
		isLoading: false,
		isFetching: false,
		isError: false,
		error: null,
		refetch: jest.fn(),
		...overrides,
	} as unknown as ReturnType< typeof useStatsStreak >;
}

function setViewportWidth( width: number ) {
	Object.defineProperty( window, 'innerWidth', { value: width, configurable: true } );
}

// jsdom reports every element as 0x0, so the tile has to be faked to reach the
// trimming and filler paths. Returns a restore callback.
function stubTileSize( width: number, height: number ) {
	const original = Element.prototype.getBoundingClientRect;

	Element.prototype.getBoundingClientRect = () => ( { width, height } ) as DOMRect;

	return () => {
		Element.prototype.getBoundingClientRect = original;
	};
}

function renderWidget( reportParams: ReportParams = REPORT_PARAMS ) {
	return render( <PostingActivityRender attributes={ { reportParams } } /> );
}

function chartDayValues() {
	return screen.getByTestId( 'heatmap' ).getAttribute( 'data-day-values' );
}

describe( 'PostingActivityWidget', () => {
	const originalInnerWidth = window.innerWidth;

	beforeEach( () => {
		mockUseStatsStreak.mockReset();
		mockUseStatsStreak.mockReturnValue( streakResult() );
		setViewportWidth( 1024 );
	} );

	afterEach( () => {
		setViewportWidth( originalInnerWidth );
	} );

	it( 'keeps the post wording and leads the tooltip with the count', () => {
		render( <PostingActivityRender attributes={ { reportParams: REPORT_PARAMS } } /> );

		// The empty label and the plural forms are this widget's own; the shared
		// component only decides that the count comes before the date.
		expect( screen.getByTestId( 'tooltip-empty' ) ).toHaveTextContent( 'No postsMon, Jun 2, 2025' );
		expect( screen.getByTestId( 'tooltip-singular' ) ).toHaveTextContent(
			'1 postTue, Jun 3, 2025'
		);
		expect( screen.getByTestId( 'tooltip-plural' ) ).toHaveTextContent( '3 postsWed, Jun 4, 2025' );
	} );

	it( 'shows the empty state when only days outside the range have posts', () => {
		// June 2025 is selected; a response still carrying an older day — a stale
		// one for a wider selection — must not suppress the empty state.
		mockUseStatsStreak.mockReturnValue( streakResult( { data: { '2024-03-05': 2 } } ) );
		render( <PostingActivityRender attributes={ { reportParams: REPORT_PARAMS } } /> );

		expect( screen.getByText( 'No posts published in this period.' ) ).toBeInTheDocument();
	} );

	// A request reaching back past the selection would attribute those months to
	// the card's heading (WOOA7S-1963).
	it( 'requests the selected period, however wide the viewport gets', () => {
		render( <PostingActivityRender attributes={ { reportParams: REPORT_PARAMS } } /> );

		expect( mockUseStatsStreak.mock.calls[ 0 ][ 0 ] ).toMatchObject( {
			startDate: '2025-06-01',
			endDate: '2025-06-30',
		} );

		setViewportWidth( 2560 );
		fireEvent.resize( window );

		const lastCall = mockUseStatsStreak.mock.calls[ mockUseStatsStreak.mock.calls.length - 1 ];
		expect( lastCall[ 0 ] ).toMatchObject( {
			startDate: '2025-06-01',
			endDate: '2025-06-30',
		} );
	} );

	it( 'caps a selection longer than the viewport could draw, and lifts the cap as it widens', () => {
		const allTime = { ...REPORT_PARAMS, from: '2015-01-01' } as unknown as ReportParams;
		render( <PostingActivityRender attributes={ { reportParams: allTime } } /> );

		// 1024px holds 76 compact columns — 532 days, rounded up to two years.
		expect( mockUseStatsStreak.mock.calls[ 0 ][ 0 ] ).toMatchObject( {
			startDate: '2023-06-30',
			endDate: '2025-06-30',
		} );

		setViewportWidth( 2560 );
		fireEvent.resize( window );

		const lastCall = mockUseStatsStreak.mock.calls[ mockUseStatsStreak.mock.calls.length - 1 ];
		expect( lastCall[ 0 ] ).toMatchObject( {
			startDate: '2021-06-28',
			endDate: '2025-06-30',
		} );
	} );

	describe( 'empty state', () => {
		it( 'speaks for the whole period when the window covered it', () => {
			mockUseStatsStreak.mockReturnValue( streakResult( { data: {} } ) );

			renderWidget();

			expect( screen.getByText( 'No posts published in this period.' ) ).toBeInTheDocument();
		} );

		// The request stops at the history the viewport can draw, so the copy has to
		// stop there too: the site may well have posts in the years left out.
		it( 'names the days requested when the period outran the window', () => {
			mockUseStatsStreak.mockReturnValue( streakResult( { data: {} } ) );

			renderWidget( { ...REPORT_PARAMS, from: '2015-01-01' } as unknown as ReportParams );

			expect(
				screen.getByText( 'No posts published between Jun 30, 2023 and Jun 30, 2025.' )
			).toBeInTheDocument();
		} );
	} );

	describe( 'in a measured tile', () => {
		const currentYear = {
			...REPORT_PARAMS,
			from: '2026-01-01',
			to: '2026-08-10',
		} as unknown as ReportParams;

		beforeEach( () => {
			mockUseStatsStreak.mockReturnValue(
				streakResult( { data: { '2026-01-05': 1, '2026-08-10': 4 } } )
			);
		} );

		it.each( [
			[ 1000, 86 ],
			[ 700, 86 ],
			[ 1000, 300 ],
		] )( 'keeps the year on screen at %ix%i', ( width, height ) => {
			const restoreTileSize = stubTileSize( width, height );

			try {
				renderWidget( currentYear );
			} finally {
				restoreTileSize();
			}

			// Regression guard (WOOA7S-1963): a tile too small for all 53 columns kept
			// empty future weeks and trimmed the year's own posts away.
			expect( chartDayValues() ).toContain( 'Mon, Aug 10, 2026:4' );
		} );

		it( 'fills the tile with filler weeks the reader cannot mistake for data', () => {
			const restoreTileSize = stubTileSize( 1000, 86 );

			try {
				renderWidget( currentYear );
			} finally {
				restoreTileSize();
			}

			const heatmap = screen.getByTestId( 'heatmap' );

			expect( heatmap ).toHaveAttribute( 'data-width', '1000' );
			expect( Number( heatmap.getAttribute( 'data-placeholders' ) ) ).toBeGreaterThan( 0 );
		} );
	} );

	it( 'shows a permission error without a retry action', () => {
		mockUseStatsStreak.mockReturnValue(
			streakResult( {
				data: undefined,
				isError: true,
				error: { error: 'unauthorized', status: 403 },
			} )
		);

		render( <PostingActivityRender attributes={ { reportParams: REPORT_PARAMS } } /> );

		expect( screen.getByText( "You don't have access to this data." ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Retry' } ) ).not.toBeInTheDocument();
	} );
} );
