/**
 * External dependencies
 */
import { useStatsVisits } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import userEvent, { PointerEventsCheckLevel } from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import ViewsOverYearsRender from '../render';
import type {
	HeatmapColumn,
	HeatmapTrailingColumn,
} from '@jetpack-premium-analytics/widgets-toolkit';
import type { ReactNode } from 'react';

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

// Keep visx out of jsdom while exposing the grid the widget builds.
jest.mock( '@jetpack-premium-analytics/externals', () => {
	const actual = jest.requireActual( '@jetpack-premium-analytics/externals' );

	const HeatmapChart = ( {
		data,
		rowLabels,
		trailingColumn,
		columnLabelAlign,
		children,
	}: {
		data: HeatmapColumn[];
		rowLabels?: string[];
		trailingColumn?: HeatmapTrailingColumn;
		columnLabelAlign?: string;
		children?: ReactNode;
	} ) => (
		<div
			data-testid="heatmap"
			data-column-label-align={ columnLabelAlign }
			data-column-labels={ data.map( column => column.label ).join( '|' ) }
			data-row-labels={ ( rowLabels ?? [] ).join( '|' ) }
			data-trailing-label={ trailingColumn?.label }
			data-trailing-values={ ( trailingColumn?.data ?? [] ).join( '|' ) }
			// One entry per row: the row's twelve months, `-` for a blank one.
			data-rows={ ( rowLabels ?? [] )
				.map( ( _label, row ) =>
					data.map( column => column.data[ row ]?.value ?? '-' ).join( ',' )
				)
				.join( '|' ) }
		>
			{ children }
		</div>
	);
	HeatmapChart.Legend = ( { lessLabel, moreLabel }: { lessLabel: string; moreLabel: string } ) => (
		<div data-testid="legend">{ `${ lessLabel }/${ moreLabel }` }</div>
	);

	return { ...actual, HeatmapChart };
} );

// Spread the real module: `WidgetRoot` and the widget's own range helpers import
// from it too.
jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsVisits: jest.fn(),
} ) );

const mockUseStatsVisits = jest.mocked( useStatsVisits );

function visitsResult( primaryData: unknown, overrides: Record< string, unknown > = {} ) {
	return {
		primary: { data: primaryData },
		comparison: { data: undefined },
		hasComparison: false,
		isLoading: false,
		isFetching: false,
		hasData: !! primaryData,
		isError: false,
		error: null,
		refetch: jest.fn(),
		...overrides,
	} as unknown as ReturnType< typeof useStatsVisits >;
}

function report( months: [ string, number ][] ) {
	return {
		summary: {},
		data: months.map( ( [ month, views ] ) => ( {
			time_interval: `${ month }-01`,
			date_start: `${ month }-01T00:00:00`,
			views,
		} ) ),
	};
}

const renderWidget = () => render( <ViewsOverYearsRender attributes={ {} } /> );

const heatmap = () => screen.getByTestId( 'heatmap' );

/**
 * jsdom has no layout to position the select's popup against, so its open
 * transition never resolves and the popup can still be carrying
 * `pointer-events: none` when a click lands. That says nothing about the
 * control in a browser, so it does not gate the click here.
 *
 * @return A user session that can click through the popup.
 */
const selectUser = () => userEvent.setup( { pointerEventsCheck: PointerEventsCheckLevel.Never } );

describe( 'ViewsOverYearsWidget', () => {
	beforeEach( () => {
		// Only the clock is faked: the select's positioner schedules its own work
		// on timers and animation frames, and faking those strands it mid-update.
		jest
			.useFakeTimers( {
				doNotFake: [
					'setTimeout',
					'clearTimeout',
					'setInterval',
					'clearInterval',
					'setImmediate',
					'clearImmediate',
					'requestAnimationFrame',
					'cancelAnimationFrame',
					'requestIdleCallback',
					'cancelIdleCallback',
					'queueMicrotask',
					'nextTick',
				],
			} )
			.setSystemTime( new Date( '2026-03-10T12:00:00Z' ) );
		mockUseStatsVisits.mockReset();
		mockUseStatsVisits.mockReturnValue(
			visitsResult(
				report( [
					[ '2025-01', 310 ],
					[ '2025-02', 280 ],
					[ '2026-01', 620 ],
					[ '2026-02', 560 ],
					[ '2026-03', 100 ],
				] )
			)
		);
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	describe( 'request parameters', () => {
		it( 'asks for monthly views over all time, not the section period', () => {
			renderWidget();

			const params = mockUseStatsVisits.mock.calls[ 0 ][ 0 ] as Record< string, unknown >;

			expect( params ).toMatchObject( { period: 'month', stat_fields: 'views' } );
			// Floored at the year WordPress.com Stats begins, so the response
			// covers every year the site could have views for.
			expect( String( params.from ) ).toMatch( /^200[45]-/ );
			expect( String( params.to ) ).toMatch( /^2026-03-10/ );
		} );

		it( 'keeps the same request when the metric changes', async () => {
			const user = selectUser();
			renderWidget();

			await user.click( screen.getByRole( 'combobox', { name: 'Views metric' } ) );
			await user.click( screen.getByRole( 'option', { name: 'Average per day' } ) );

			const requested = mockUseStatsVisits.mock.calls.map( call => JSON.stringify( call[ 0 ] ) );
			expect( new Set( requested ).size ).toBe( 1 );
		} );
	} );

	describe( 'the grid', () => {
		it( 'labels a row per year, newest first, over twelve month columns', () => {
			renderWidget();

			expect( heatmap() ).toHaveAttribute( 'data-row-labels', '2026|2025' );
			expect( heatmap().getAttribute( 'data-column-labels' )?.split( '|' ) ).toHaveLength( 12 );
			expect( heatmap() ).toHaveAttribute( 'data-column-label-align', 'center' );
		} );

		it( 'blanks the months outside the site’s span', () => {
			renderWidget();

			const [ current, previous ] = heatmap().getAttribute( 'data-rows' )!.split( '|' );
			// April onwards has not happened yet.
			expect( current ).toBe( '620,560,100,-,-,-,-,-,-,-,-,-' );
			// The site's first month is January 2025, so nothing is blank behind it.
			expect( previous ).toBe( '310,280,0,0,0,0,0,0,0,0,0,0' );
		} );

		it( 'totals each year in its own column', () => {
			renderWidget();

			expect( heatmap() ).toHaveAttribute( 'data-trailing-label', 'Totals' );
			expect( heatmap() ).toHaveAttribute( 'data-trailing-values', '1280|590' );
		} );

		it( 'labels the scale in views', () => {
			renderWidget();

			expect( screen.getByTestId( 'legend' ) ).toHaveTextContent( 'Fewer views/More views' );
		} );
	} );

	describe( 'the metric control', () => {
		it( 'switches the cells and the roll-up to a daily average', async () => {
			const user = selectUser();
			renderWidget();

			await user.click( screen.getByRole( 'combobox', { name: 'Views metric' } ) );
			await user.click( screen.getByRole( 'option', { name: 'Average per day' } ) );

			const [ current ] = heatmap().getAttribute( 'data-rows' )!.split( '|' );
			// 620/31, 560/28, and March over the ten days that have happened.
			expect( current ).toBe( '20,20,10,-,-,-,-,-,-,-,-,-' );
			expect( heatmap() ).toHaveAttribute( 'data-trailing-label', 'Average' );
			// 1280 views over 31 + 28 + 10 days.
			expect( heatmap() ).toHaveAttribute(
				'data-trailing-values',
				`${ Math.round( 1280 / 69 ) }|${ Math.round( 590 / 365 ) }`
			);
		} );

		it( 'stays available while the widget is loading', () => {
			mockUseStatsVisits.mockReturnValue(
				visitsResult( undefined, { isLoading: true, hasData: false } )
			);
			renderWidget();

			expect( screen.getByRole( 'combobox', { name: 'Views metric' } ) ).toBeInTheDocument();
			expect( screen.queryByTestId( 'heatmap' ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'empty and error states', () => {
		it( 'reports no views when the site has never had one', () => {
			mockUseStatsVisits.mockReturnValue( visitsResult( report( [ [ '2025-01', 0 ] ] ) ) );
			renderWidget();

			expect( screen.getByText( 'No views yet.' ) ).toBeInTheDocument();
			expect( screen.queryByTestId( 'heatmap' ) ).not.toBeInTheDocument();
		} );

		it( 'offers a retry when the request fails with nothing to fall back on', () => {
			const refetch = jest.fn();
			mockUseStatsVisits.mockReturnValue(
				visitsResult( undefined, {
					isError: true,
					error: { code: 'no_connection' },
					refetch,
				} )
			);
			renderWidget();

			expect(
				screen.getByText( "We couldn't load your views. Please try again in a moment." )
			).toBeInTheDocument();
		} );

		it( 'keeps the rows on screen when a background refetch fails', () => {
			mockUseStatsVisits.mockReturnValue(
				visitsResult( report( [ [ '2026-01', 620 ] ] ), {
					isError: true,
					error: { code: 'no_connection' },
				} )
			);
			renderWidget();

			expect( heatmap() ).toHaveAttribute( 'data-row-labels', '2026' );
			expect( screen.queryByText( /couldn't load/ ) ).not.toBeInTheDocument();
		} );
	} );
} );
