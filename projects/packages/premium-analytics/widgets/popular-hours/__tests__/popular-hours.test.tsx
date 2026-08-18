/**
 * External dependencies
 */
import { useStatsHourOfDay } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import PopularHoursRender from '../render';
import type { ReportParams } from '@jetpack-premium-analytics/data';

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

// Keep visx out of jsdom and make the series the widget passes assertable.
jest.mock( '@jetpack-premium-analytics/externals', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/externals' ),
	Sparkline: ( { data }: { data: number[] } ) => (
		<div data-testid="sparkline" data-points={ data.join( ',' ) } />
	),
} ) );

// Spread the real module: `WidgetRoot` and the toolkit helpers import from it too.
jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsHourOfDay: jest.fn(),
} ) );

const mockUseStatsHourOfDay = jest.mocked( useStatsHourOfDay );

const REPORT_PARAMS = {
	from: '2026-07-14',
	to: '2026-08-12',
	interval: 'day',
	comp: '1',
	compare_from: '2026-06-14',
	compare_to: '2026-07-13',
	compare_preset: 'previous_period',
} as unknown as ReportParams;

/**
 * A ten-day report whose only traffic is at hours 7 and 19.
 *
 * @param views - Views for hour 19.
 * @return A sanitized hour-of-day report.
 */
function report( views = 300 ) {
	const viewsByHour: Record< number, number > = { 7: 100, 19: views };

	return {
		startDate: '2026-08-03',
		date: '2026-08-12',
		days: 10,
		buckets: Array.from( { length: 24 }, ( _, hour ) => ( {
			hour,
			views: viewsByHour[ hour ] ?? 0,
		} ) ),
	};
}

function hourOfDayResult( primaryData: unknown, overrides: Record< string, unknown > = {} ) {
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
	} as unknown as ReturnType< typeof useStatsHourOfDay >;
}

function renderWidget( reportParams: ReportParams = REPORT_PARAMS ) {
	return render( <PopularHoursRender attributes={ { reportParams } } /> );
}

describe( 'PopularHoursWidget', () => {
	beforeEach( () => {
		mockUseStatsHourOfDay.mockReset();
	} );

	it( 'headlines the busiest hour as a site-format label', () => {
		mockUseStatsHourOfDay.mockReturnValue( hourOfDayResult( report() ) );

		renderWidget();

		expect( screen.getByText( '7 pm' ) ).toBeInTheDocument();
	} );

	it( 'shows the mean per day, dividing by the range the response reports', () => {
		// 300 views over the ten days 2026-08-03..2026-08-12 is 30 a day.
		mockUseStatsHourOfDay.mockReturnValue( hourOfDayResult( report() ) );

		renderWidget();

		expect( screen.getByText( '30 views' ) ).toBeInTheDocument();
	} );

	it( 'updates the average when the response reports a different range', () => {
		mockUseStatsHourOfDay.mockReturnValue( hourOfDayResult( { ...report(), days: 5 } ) );

		renderWidget();

		// The same 300 views average 60 over five days instead of 30 over ten.
		expect( screen.getByText( '60 views' ) ).toBeInTheDocument();
	} );

	it( 'plots all 24 hourly averages in hour order', () => {
		mockUseStatsHourOfDay.mockReturnValue( hourOfDayResult( report() ) );

		renderWidget();

		const points = screen.getByTestId( 'sparkline' ).getAttribute( 'data-points' )?.split( ',' );

		expect( points ).toHaveLength( 24 );
		expect( points?.[ 7 ] ).toBe( '10' );
		expect( points?.[ 19 ] ).toBe( '30' );
		expect( points?.[ 0 ] ).toBe( '0' );
	} );

	it( 'abbreviates a large average but keeps the exact figure available', () => {
		mockUseStatsHourOfDay.mockReturnValue(
			hourOfDayResult( {
				...report(),
				days: 1,
				buckets: Array.from( { length: 24 }, ( _, hour ) => ( {
					hour,
					views: hour === 19 ? 166900 : 0,
				} ) ),
			} )
		);

		renderWidget();

		expect( screen.getByText( '166.9K views' ) ).toBeInTheDocument();
		expect( screen.getByTitle( '166,900' ) ).toBeInTheDocument();
		expect( screen.getByText( '166.9K views' ) ).toHaveAttribute( 'aria-hidden', 'true' );
		expect( screen.getByText( '166,900 views' ) ).toBeInTheDocument();
	} );

	it( 'strips comparison params, since the endpoint has no comparison period', () => {
		mockUseStatsHourOfDay.mockReturnValue( hourOfDayResult( report() ) );

		renderWidget();

		const params = mockUseStatsHourOfDay.mock.calls[ 0 ][ 0 ];
		expect( params ).not.toHaveProperty( 'comp' );
		expect( params ).not.toHaveProperty( 'compare_from' );
		expect( params ).not.toHaveProperty( 'compare_to' );
		expect( params ).not.toHaveProperty( 'compare_preset' );
	} );

	it( 'renders the empty state when the range drew no views at all', () => {
		mockUseStatsHourOfDay.mockReturnValue(
			hourOfDayResult( {
				...report(),
				buckets: Array.from( { length: 24 }, ( _, hour ) => ( { hour, views: 0 } ) ),
			} )
		);

		renderWidget();

		expect( screen.getByText( 'No views in this period.' ) ).toBeInTheDocument();
		expect( screen.queryByTestId( 'sparkline' ) ).not.toBeInTheDocument();
	} );

	it( 'routes a permission-gated 403 through describeError: neutral copy, no retry', () => {
		mockUseStatsHourOfDay.mockReturnValue(
			hourOfDayResult( undefined, {
				isError: true,
				error: { error: 'unauthorized', status: 403 },
			} )
		);

		renderWidget();

		expect( screen.getByText( "You don't have access to this data." ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Retry' } ) ).not.toBeInTheDocument();
	} );

	it( 'offers a retry for a failure that can heal', () => {
		mockUseStatsHourOfDay.mockReturnValue(
			hourOfDayResult( undefined, {
				isError: true,
				error: { error: 'no_connection', status: 403 },
			} )
		);

		renderWidget();

		expect(
			screen.getByText( "We couldn't load your popular hours. Please try again in a moment." )
		).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Retry' } ) ).toBeInTheDocument();
	} );

	it( 'keeps the rendered peak when a refetch fails, instead of showing the error', () => {
		mockUseStatsHourOfDay.mockReturnValue(
			hourOfDayResult( report(), { isError: true, error: { error: 'no_connection', status: 403 } } )
		);

		renderWidget();

		expect( screen.getByText( '7 pm' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Retry' } ) ).not.toBeInTheDocument();
	} );
} );
