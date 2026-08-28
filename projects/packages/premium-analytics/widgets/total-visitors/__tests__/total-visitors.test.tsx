/**
 * External dependencies
 */
import { useStatsVisits } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import TotalVisitorsRender from '../render';
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
	from: '2026-07-01',
	to: '2026-07-31',
	interval: 'day',
	comp: '1',
	compare_from: '2026-06-01',
	compare_to: '2026-06-30',
	compare_preset: 'previous_period',
} as unknown as ReportParams;

const REPORT = {
	summary: { views: 999, visitors: 291900 },
	data: [
		{ date_start: '2026-07-01', views: 333, visitors: 100000 },
		{ date_start: '2026-07-02', views: 333, visitors: 100000 },
		{ date_start: '2026-07-03', views: 333, visitors: 91900 },
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
	return render( <TotalVisitorsRender attributes={ { reportParams } } /> );
}

describe( 'TotalVisitorsWidget', () => {
	beforeEach( () => {
		mockUseStatsVisits.mockReset();
	} );

	it( 'renders the abbreviated total over the sparkline series', () => {
		mockUseStatsVisits.mockReturnValue( visitsResult( REPORT ) );

		renderWidget();

		expect( screen.getByText( '291.9K' ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'sparkline' ) ).toHaveAttribute(
			'data-points',
			'100000,100000,91900'
		);
	} );

	it( 'exposes the unabbreviated total for hover and assistive technology', () => {
		mockUseStatsVisits.mockReturnValue( visitsResult( REPORT ) );

		renderWidget();

		expect( screen.getByTitle( '291,900' ) ).toBeInTheDocument();
		expect( screen.getByText( '291,900' ) ).toBeInTheDocument();
		expect( screen.getByText( '291.9K' ) ).toHaveAttribute( 'aria-hidden', 'true' );
	} );

	it( 'does not force a decimal when the total is not abbreviated', () => {
		mockUseStatsVisits.mockReturnValue(
			visitsResult( {
				summary: { views: 999, visitors: 947 },
				data: [
					{ date_start: '2026-07-01', views: 333, visitors: 300 },
					{ date_start: '2026-07-02', views: 333, visitors: 300 },
					{ date_start: '2026-07-03', views: 333, visitors: 347 },
				],
			} )
		);

		renderWidget();

		expect( screen.getByText( '947' ) ).toBeInTheDocument();
		expect( screen.queryByText( '947.0' ) ).not.toBeInTheDocument();
	} );

	it( 'keeps daily buckets on a coarse dashboard interval, so the total keeps its meaning', () => {
		mockUseStatsVisits.mockReturnValue( visitsResult( REPORT ) );

		renderWidget( { ...REPORT_PARAMS, interval: 'month' } as ReportParams );

		expect( mockUseStatsVisits.mock.calls[ 0 ][ 0 ] ).toMatchObject( { period: 'day' } );
	} );

	it( 'requests both traffic fields, without comparison, so the two total cards share the query', () => {
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
		mockUseStatsVisits.mockReturnValue( visitsResult( { summary: { visitors: 0 }, data: [] } ) );

		renderWidget();

		expect( screen.getByText( 'No visitors in this period.' ) ).toBeInTheDocument();
		expect( screen.queryByTestId( 'sparkline' ) ).not.toBeInTheDocument();
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
			screen.getByText( "We couldn't load your visitors. Please try again in a moment." )
		).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Retry' } ) ).toBeInTheDocument();
	} );

	it( 'keeps the rendered rows when a refetch fails, instead of showing the error', () => {
		mockUseStatsVisits.mockReturnValue(
			visitsResult( REPORT, { isError: true, error: { error: 'no_connection', status: 403 } } )
		);

		renderWidget();

		expect( screen.getByText( '291.9K' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Retry' } ) ).not.toBeInTheDocument();
	} );
} );
