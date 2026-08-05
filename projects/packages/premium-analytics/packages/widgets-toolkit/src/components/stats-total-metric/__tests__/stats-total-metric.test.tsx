/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import { seen } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { StatsTotalMetricWidget } from '../stats-total-metric';
import { useStatsTotalMetric } from '../use-stats-total-metric';

// Keep visx out of jsdom and make the series the component passes assertable.
jest.mock( '@jetpack-premium-analytics/externals', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/externals' ),
	Sparkline: ( { data }: { data: number[] } ) => (
		<div data-testid="sparkline" data-points={ data.join( ',' ) } />
	),
} ) );

jest.mock( '../../widget-root', () => ( {
	...jest.requireActual( '../../widget-root' ),
	useWidgetRootContext: () => ( {
		reportParams: { from: '2026-07-01', to: '2026-07-31', interval: 'day' },
	} ),
} ) );

jest.mock( '../use-stats-total-metric' );

const mockUseStatsTotalMetric = jest.mocked( useStatsTotalMetric );

const PROPS = {
	field: 'views' as const,
	emptyIcon: seen,
	emptyDescription: 'No views in this period.',
	retryDescription: "We couldn't load views.",
};

function state( overrides: Record< string, unknown > = {} ) {
	return {
		total: 291900,
		points: [ 10, 20, 30 ],
		isLoading: false,
		isFetching: false,
		isError: false,
		error: null,
		refetch: jest.fn(),
		...overrides,
	} as ReturnType< typeof useStatsTotalMetric >;
}

describe( 'StatsTotalMetricWidget', () => {
	beforeEach( () => {
		mockUseStatsTotalMetric.mockReset();
	} );

	it( 'renders the abbreviated total over the sparkline series', () => {
		mockUseStatsTotalMetric.mockReturnValue( state() );

		render( <StatsTotalMetricWidget { ...PROPS } /> );

		expect( screen.getByText( '291.9K' ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'sparkline' ) ).toHaveAttribute( 'data-points', '10,20,30' );
	} );

	it( 'exposes the unabbreviated total for hover and assistive technology', () => {
		mockUseStatsTotalMetric.mockReturnValue( state() );

		render( <StatsTotalMetricWidget { ...PROPS } /> );

		expect( screen.getByTitle( '291,900' ) ).toBeInTheDocument();
	} );

	it( 'renders the empty state when the range has no buckets', () => {
		mockUseStatsTotalMetric.mockReturnValue( state( { total: 0, points: [] } ) );

		render( <StatsTotalMetricWidget { ...PROPS } /> );

		expect( screen.getByText( 'No views in this period.' ) ).toBeInTheDocument();
		expect( screen.queryByTestId( 'sparkline' ) ).not.toBeInTheDocument();
	} );

	it( 'routes a permission-gated 403 through describeError: neutral copy, no retry', () => {
		mockUseStatsTotalMetric.mockReturnValue(
			state( {
				points: [],
				isError: true,
				error: { error: 'unauthorized', status: 403 },
			} )
		);

		render( <StatsTotalMetricWidget { ...PROPS } /> );

		expect( screen.getByText( "You don't have access to this data." ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Retry' } ) ).not.toBeInTheDocument();
	} );

	it( 'offers a retry for a failure that can heal', () => {
		mockUseStatsTotalMetric.mockReturnValue(
			state( {
				points: [],
				isError: true,
				error: { error: 'no_connection', status: 403 },
			} )
		);

		render( <StatsTotalMetricWidget { ...PROPS } /> );

		expect( screen.getByText( "We couldn't load views." ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Retry' } ) ).toBeInTheDocument();
	} );
} );
