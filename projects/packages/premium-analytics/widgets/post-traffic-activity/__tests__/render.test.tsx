/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import PostTrafficActivityRender from '../render';
import usePostTrafficActivity from '../use-post-traffic-activity';
import type { ReportParams } from '@jetpack-premium-analytics/data';
import type { ReactNode } from 'react';

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

jest.mock( '../use-post-traffic-activity' );

let mockCardWidth: number | undefined;

// jsdom's ResizeObserver never fires, so the real hook leaves the card unmeasured
// and the width-driven page span is unreachable from a test. Drive it directly.
jest.mock( '@wordpress/compose', () => ( {
	...jest.requireActual( '@wordpress/compose' ),
	useResizeObserver:
		( onResize: ( entries: { contentRect: { width: number } }[] ) => void ) =>
		( element: HTMLElement | null ) => {
			if ( element && mockCardWidth !== undefined ) {
				onResize( [ { contentRect: { width: mockCardWidth } } ] );
			}
		},
} ) );

type TooltipData = { value: number | null; cellLabel?: string; row: number; column: number };

// Keep visx out of jsdom while exercising the widget's tooltip renderer with
// one cell of each kind: a pre-range filler blank, an in-range blank, and
// singular/plural counted cells.
jest.mock( '@jetpack-premium-analytics/externals', () => {
	const actual = jest.requireActual( '@jetpack-premium-analytics/externals' );

	return {
		...actual,
		HeatmapChartUnresponsive: ( {
			renderTooltip,
		}: {
			renderTooltip?: ( data: TooltipData ) => ReactNode;
		} ) => (
			<>
				<div data-testid="tooltip-filler-blank">
					{ renderTooltip?.( {
						value: null,
						cellLabel: 'Mon, Jul 6, 2026',
						row: 0,
						column: 0,
					} ) }
				</div>
				<div data-testid="tooltip-in-range-blank">
					{ renderTooltip?.( {
						value: null,
						cellLabel: 'Mon, Jul 13, 2026',
						row: 0,
						column: 1,
					} ) }
				</div>
				<div data-testid="tooltip-singular">
					{ renderTooltip?.( { value: 1, cellLabel: 'Tue, Jul 14, 2026', row: 1, column: 1 } ) }
				</div>
				<div data-testid="tooltip-plural">
					{ renderTooltip?.( {
						value: 1234,
						cellLabel: 'Wed, Jul 15, 2026',
						row: 2,
						column: 1,
					} ) }
				</div>
			</>
		),
	};
} );

const mockUsePostTrafficActivity = jest.mocked( usePostTrafficActivity );

// Two Monday-aligned weeks: the first is entirely pre-range filler, the second
// is the selected range. `column * 7 + row` maps a cell back to this series.
function twoWeeksOfDays() {
	const days = [];
	for ( let i = 0; i < 14; i++ ) {
		const day = new Date( Date.UTC( 2026, 6, 6 + i ) );
		days.push( { dateString: day.toISOString().slice( 0, 10 ), value: null } );
	}
	days[ 8 ].value = 1;
	days[ 9 ].value = 1234;
	return days;
}

const REPORT_PARAMS = {
	post_id: 779,
	from: '2026-07-13T00:00:00.000+08:00',
	to: '2026-07-19T23:59:59.999+08:00',
} as unknown as ReportParams;

beforeEach( () => {
	mockCardWidth = undefined;
	mockUsePostTrafficActivity.mockReset();
	mockUsePostTrafficActivity.mockReturnValue( {
		days: twoWeeksOfDays(),
		isPaged: false,
		canShowOlder: false,
		canShowNewer: false,
		showOlder: jest.fn(),
		showNewer: jest.fn(),
		isLoading: false,
		isFetching: false,
		isError: false,
		hasData: true,
		refetch: jest.fn(),
	} );
} );

describe( 'PostTrafficActivity tooltip', () => {
	it( 'labels blanks by what the blank means, and leads counted cells with the count', () => {
		render( <PostTrafficActivityRender attributes={ { reportParams: REPORT_PARAMS } } /> );

		// Pre-range filler is masked, not measured — no claim about its views.
		expect( screen.getByTestId( 'tooltip-filler-blank' ) ).toHaveTextContent( 'No data' );
		// An in-range day with no recorded views really had none.
		expect( screen.getByTestId( 'tooltip-in-range-blank' ) ).toHaveTextContent( 'No views' );

		expect( screen.getByTestId( 'tooltip-singular' ) ).toHaveTextContent( '1 view' );
		expect( screen.getByTestId( 'tooltip-plural' ) ).toHaveTextContent( '1,234 views' );

		// The date stays in the tooltip, below the count.
		expect( screen.getByTestId( 'tooltip-filler-blank' ) ).toHaveTextContent( 'Mon, Jul 6, 2026' );
	} );
} );

describe( 'PostTrafficActivity page span', () => {
	// The days the widget asked the hook for — one page, seven days a column.
	function requestedDays() {
		return mockUsePostTrafficActivity.mock.calls.at( -1 )?.[ 2 ];
	}

	it( 'asks for the whole week columns the card width can draw', () => {
		mockCardWidth = 1000;

		render( <PostTrafficActivityRender attributes={ { reportParams: REPORT_PARAMS } } /> );

		// floor( (1000 - 48) / (64 + 4) ) = 14 columns.
		expect( requestedDays() ).toBe( 14 * 7 );
	} );

	it( 'holds the minimum page rather than shrink to what a narrow card fits', () => {
		mockCardWidth = 200;

		render( <PostTrafficActivityRender attributes={ { reportParams: REPORT_PARAMS } } /> );

		// The width only draws 2 columns; the minimum keeps the page at 4.
		expect( requestedDays() ).toBe( 4 * 7 );
	} );

	it( 'asks for the default page before the card is measured', () => {
		render( <PostTrafficActivityRender attributes={ { reportParams: REPORT_PARAMS } } /> );

		expect( requestedDays() ).toBe( 16 * 7 );
	} );
} );
