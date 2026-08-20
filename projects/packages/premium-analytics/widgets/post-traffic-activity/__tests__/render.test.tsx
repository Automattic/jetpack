/**
 * External dependencies
 */
import { act, render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import PostTrafficActivityRender from '../render';
import usePostTrafficActivity from '../use-post-traffic-activity';
import type { ReportParams } from '@jetpack-premium-analytics/data';
import type { ReactNode } from 'react';

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

jest.mock( '../use-post-traffic-activity' );

// Width the mocked observer reports when the card is first attached; `undefined`
// leaves the card unmeasured, as jsdom does.
let mockCardWidth: number | undefined;
// Reports a later width, so a test can drive a resize rather than only a mount.
let mockFireResize: ( ( width: number ) => void ) | undefined;
let mockAttachRef: ( ( element: HTMLElement | null ) => void ) | undefined;
type ResizeHandler = ( entries: { contentRect: { width: number } }[] ) => void;
let mockResizeHandlers: ResizeHandler[] = [];

// jsdom's ResizeObserver never fires, so the real hook leaves the card unmeasured
// and the width-driven page span is unreachable from a test. Drive it directly.
// The widget consumes the hook twice — its own card-width observer plus the one
// inside `useElementSize` — so a resize is broadcast to every handler: the width
// handler reads the entry, while `useElementSize` falls back to measuring its
// own element, and both dedupe repeats.
jest.mock( '@wordpress/compose', () => ( {
	...jest.requireActual( '@wordpress/compose' ),
	useResizeObserver: ( onResize: ResizeHandler ) => {
		mockResizeHandlers.push( onResize );
		mockFireResize = width =>
			mockResizeHandlers.forEach( handler => handler( [ { contentRect: { width } } ] ) );
		// One stable ref callback for the whole file. A fresh arrow per render would
		// make React detach and re-attach on every commit, replaying the mount width
		// and undoing whatever a test fired.
		mockAttachRef ??= element => {
			if ( element && mockCardWidth !== undefined ) {
				mockFireResize?.( mockCardWidth );
			}
		};

		return mockAttachRef;
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
			maxCellHeight,
		}: {
			renderTooltip?: ( data: TooltipData ) => ReactNode;
			maxCellHeight?: number;
		} ) => (
			<>
				<div data-testid="max-cell-height">{ maxCellHeight }</div>
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
	mockFireResize = undefined;
	mockResizeHandlers = [];
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

// The cell-height cap follows the measured chart area so the grid — month-label
// header row included — never outgrows the tile and clips. jsdom reports a zero
// rect by default, which doubles as the unmeasured initial render.
describe( 'PostTrafficActivity cell sizing', () => {
	beforeEach( () => {
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

	afterEach( () => {
		jest.restoreAllMocks();
	} );

	function mockMeasuredHeight( height: number ) {
		jest
			.spyOn( HTMLDivElement.prototype, 'getBoundingClientRect' )
			.mockReturnValue( { width: 700, height } as DOMRect );
	}

	it( 'keeps the design cap while the area is unmeasured', () => {
		render( <PostTrafficActivityRender attributes={ { reportParams: REPORT_PARAMS } } /> );

		expect( screen.getByTestId( 'max-cell-height' ) ).toHaveTextContent( '42' );
	} );

	it( 'shrinks the cells so a short tile still fits the month-label row', () => {
		// 200px minus the 44px grid overhead leaves 156px for seven rows → 22px.
		mockMeasuredHeight( 200 );
		render( <PostTrafficActivityRender attributes={ { reportParams: REPORT_PARAMS } } /> );

		expect( screen.getByTestId( 'max-cell-height' ) ).toHaveTextContent( '22' );
	} );

	it( 'keeps the design cap when the tile offers more than enough height', () => {
		mockMeasuredHeight( 600 );
		render( <PostTrafficActivityRender attributes={ { reportParams: REPORT_PARAMS } } /> );

		expect( screen.getByTestId( 'max-cell-height' ) ).toHaveTextContent( '42' );
	} );

	it( 'clamps to the minimum readable cell on a collapsed tile', () => {
		mockMeasuredHeight( 50 );
		render( <PostTrafficActivityRender attributes={ { reportParams: REPORT_PARAMS } } /> );

		expect( screen.getByTestId( 'max-cell-height' ) ).toHaveTextContent( '8' );
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

		// floor( (1000 - 32) / (64 + 4) ) = 14 columns.
		expect( requestedDays() ).toBe( 14 * 7 );
	} );

	it( 'repages on resize, measuring the card in whole pixels', () => {
		mockCardWidth = 1000;

		render( <PostTrafficActivityRender attributes={ { reportParams: REPORT_PARAMS } } /> );
		expect( requestedDays() ).toBe( 14 * 7 );

		// A real observer reports subpixels, and 439.6 straddles a column boundary:
		// round( 439.6 ) = 440 draws 6 columns, while the unrounded width floors to 5.
		act( () => mockFireResize?.( 439.6 ) );

		expect( requestedDays() ).toBe( 6 * 7 );
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
