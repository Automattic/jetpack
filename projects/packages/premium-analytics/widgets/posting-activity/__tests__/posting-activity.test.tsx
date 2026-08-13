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
			renderTooltip,
		}: {
			renderTooltip?: ( data: HeatmapTooltipData ) => ReactNode;
		} ) => (
			<>
				<div data-testid="heatmap" />
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

	it( 'updates the shared history window when the viewport is resized', () => {
		render( <PostingActivityRender attributes={ { reportParams: REPORT_PARAMS } } /> );

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
