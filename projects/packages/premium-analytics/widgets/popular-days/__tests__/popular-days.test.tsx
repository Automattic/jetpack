/**
 * External dependencies
 */
import { useStatsVisits } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import PopularDaysRender from '../render';
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
	useStatsVisits: jest.fn(),
} ) );

const mockUseStatsVisits = jest.mocked( useStatsVisits );

const REPORT_PARAMS = {
	from: '2026-07-06',
	to: '2026-07-26',
	interval: 'day',
	comp: '1',
	compare_from: '2026-06-15',
	compare_to: '2026-07-05',
	compare_preset: 'previous_period',
} as unknown as ReportParams;

function dailyRow( date: string, views: number ) {
	return { date_start: `${ date }T00:00:00+00:00`, time_interval: date, views, visitors: 1 };
}

// Three Mondays at 10 views each and one Tuesday at 25. Monday has the larger
// total, Tuesday the larger average — the case the averaging exists for.
const REPORT = {
	summary: { views: 55 },
	data: [
		dailyRow( '2026-07-06', 10 ),
		dailyRow( '2026-07-07', 25 ),
		dailyRow( '2026-07-13', 10 ),
		dailyRow( '2026-07-20', 10 ),
	],
};

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

function renderWidget( reportParams: ReportParams = REPORT_PARAMS ) {
	return render( <PopularDaysRender attributes={ { reportParams } } /> );
}

describe( 'PopularDaysWidget', () => {
	beforeEach( () => {
		mockUseStatsVisits.mockReset();
	} );

	it( 'headlines the weekday with the highest average, not the highest total', () => {
		mockUseStatsVisits.mockReturnValue( visitsResult( REPORT ) );

		renderWidget();

		expect( screen.getByText( 'Tuesday' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Monday' ) ).not.toBeInTheDocument();
		expect( screen.getByText( '25 views' ) ).toBeInTheDocument();
	} );

	it( 'plots seven Monday-first averages, so the chart agrees with the headline', () => {
		mockUseStatsVisits.mockReturnValue( visitsResult( REPORT ) );

		renderWidget();

		expect( screen.getByTestId( 'sparkline' ) ).toHaveAttribute( 'data-points', '10,25,0,0,0,0,0' );
	} );

	it( 'abbreviates a large average but keeps the exact figure available', () => {
		mockUseStatsVisits.mockReturnValue(
			visitsResult( { summary: { views: 166900 }, data: [ dailyRow( '2026-07-06', 166900 ) ] } )
		);

		renderWidget();

		expect( screen.getByText( '166.9K views' ) ).toBeInTheDocument();
		expect( screen.getByTitle( '166,900' ) ).toBeInTheDocument();
	} );

	it( 'keeps daily buckets on a coarse dashboard interval, so weekdays stay separable', () => {
		mockUseStatsVisits.mockReturnValue( visitsResult( REPORT ) );

		renderWidget( { ...REPORT_PARAMS, interval: 'month' } as ReportParams );

		expect( mockUseStatsVisits.mock.calls[ 0 ][ 0 ] ).toMatchObject( { period: 'day' } );
	} );

	it( 'requests both traffic fields, without comparison, so it shares the totals query', () => {
		mockUseStatsVisits.mockReturnValue( visitsResult( REPORT ) );

		renderWidget();

		const params = mockUseStatsVisits.mock.calls[ 0 ][ 0 ];
		expect( params ).toMatchObject( { stat_fields: 'views,visitors', period: 'day' } );
		expect( params ).not.toHaveProperty( 'comp' );
		expect( params ).not.toHaveProperty( 'compare_from' );
		expect( params ).not.toHaveProperty( 'compare_to' );
		expect( params ).not.toHaveProperty( 'compare_preset' );
	} );

	it( 'renders the empty state when the range has no buckets', () => {
		mockUseStatsVisits.mockReturnValue( visitsResult( { summary: { views: 0 }, data: [] } ) );

		renderWidget();

		expect( screen.getByText( 'No views in this period.' ) ).toBeInTheDocument();
		expect( screen.queryByTestId( 'sparkline' ) ).not.toBeInTheDocument();
	} );

	it( 'still headlines a weekday when every day in range drew zero views', () => {
		mockUseStatsVisits.mockReturnValue(
			visitsResult( { summary: { views: 0 }, data: [ dailyRow( '2026-07-06', 0 ) ] } )
		);

		renderWidget();

		expect( screen.getByText( 'Monday' ) ).toBeInTheDocument();
		expect( screen.getByText( '0 views' ) ).toBeInTheDocument();
	} );

	it( 'routes a permission-gated 403 through describeError: neutral copy, no retry', () => {
		mockUseStatsVisits.mockReturnValue(
			visitsResult( undefined, { isError: true, error: { error: 'unauthorized', status: 403 } } )
		);

		renderWidget();

		expect( screen.getByText( "You don't have access to this data." ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Retry' } ) ).not.toBeInTheDocument();
	} );

	it( 'offers a retry for a failure that can heal', () => {
		mockUseStatsVisits.mockReturnValue(
			visitsResult( undefined, { isError: true, error: { error: 'no_connection', status: 403 } } )
		);

		renderWidget();

		expect(
			screen.getByText( "We couldn't load your popular days. Please try again in a moment." )
		).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Retry' } ) ).toBeInTheDocument();
	} );

	it( 'keeps the rendered peak when a refetch fails, instead of showing the error', () => {
		mockUseStatsVisits.mockReturnValue(
			visitsResult( REPORT, { isError: true, error: { error: 'no_connection', status: 403 } } )
		);

		renderWidget();

		expect( screen.getByText( 'Tuesday' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Retry' } ) ).not.toBeInTheDocument();
	} );
} );
