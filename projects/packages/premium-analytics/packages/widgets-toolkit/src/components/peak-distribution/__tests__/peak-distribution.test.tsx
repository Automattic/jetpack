/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { PeakDistribution } from '../peak-distribution';

// Keep visx out of jsdom and make the series the component passes assertable.
jest.mock( '@jetpack-premium-analytics/externals', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/externals' ),
	Sparkline: ( { data }: { data: number[] } ) => (
		<div data-testid="sparkline" data-points={ data.join( ',' ) } />
	),
} ) );

describe( 'PeakDistribution', () => {
	it( 'abbreviates a value at or above 1000 but keeps the exact figure available', () => {
		render( <PeakDistribution label="Tuesday" value={ 166900 } points={ [ 166900 ] } /> );

		expect( screen.getByText( '166.9K views' ) ).toBeInTheDocument();
		expect( screen.getByTitle( '166,900' ) ).toBeInTheDocument();
		// `title` is not reliably announced, so the abbreviation is hidden from
		// assistive tech and the exact figure is read in its place.
		expect( screen.getByText( '166.9K views' ) ).toHaveAttribute( 'aria-hidden', 'true' );
		expect( screen.getByText( '166,900 views' ) ).toBeInTheDocument();
	} );

	it( 'renders a single node, with no hidden duplicate, for a value below 1000', () => {
		render( <PeakDistribution label="Monday" value={ 25 } points={ [ 25 ] } /> );

		expect( screen.getAllByText( '25 views' ) ).toHaveLength( 1 );
		expect( screen.getByText( '25 views' ) ).not.toHaveAttribute( 'aria-hidden' );
	} );

	it( 'renders a fractional daily average without rounding it to zero', () => {
		render(
			<PeakDistribution
				label="7 pm"
				value={ 0.3 }
				points={ [ 0.1, 0.3 ] }
				valueDecimals={ 1 }
				valueUnit="views-per-day"
			/>
		);

		expect( screen.getByText( '0.3 views per day' ) ).toBeInTheDocument();
	} );

	it( 'bounds a daily average that would otherwise render as zero', () => {
		// 18 views over a year is 0.049 a day, which one decimal rounds to "0.0".
		render(
			<PeakDistribution
				label="7 pm"
				value={ 18 / 366 }
				points={ [ 18 / 366 ] }
				valueDecimals={ 1 }
				valueUnit="views-per-day"
			/>
		);

		expect( screen.getByText( 'Fewer than 0.1 views per day' ) ).toBeInTheDocument();
		expect( screen.queryByText( '0.0 views per day' ) ).not.toBeInTheDocument();
	} );

	it( 'bounds a whole-number figure below one at a single view', () => {
		render( <PeakDistribution label="Monday" value={ 0.4 } points={ [ 0.4 ] } /> );

		expect( screen.getByText( 'Fewer than 1 view' ) ).toBeInTheDocument();
	} );

	it( 'uses the singular daily-average label for exactly one view', () => {
		render(
			<PeakDistribution label="7 pm" value={ 1 } points={ [ 1 ] } valueUnit="views-per-day" />
		);

		expect( screen.getByText( '1 view per day' ) ).toBeInTheDocument();
	} );

	it( 'chooses the plural form from the displayed precision', () => {
		render( <PeakDistribution label="Monday" value={ 1.4 } points={ [ 1.4 ] } /> );

		expect( screen.getByText( '1 view' ) ).toBeInTheDocument();
	} );

	it( 'passes the points to the chart in order', () => {
		render(
			<PeakDistribution label="Tuesday" value={ 25 } points={ [ 10, 25, 0, 0, 0, 0, 0 ] } />
		);

		expect( screen.getByTestId( 'sparkline' ) ).toHaveAttribute( 'data-points', '10,25,0,0,0,0,0' );
	} );
} );
