/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { BarChartSkeleton } from '../bar-chart-skeleton';

describe( 'BarChartSkeleton', () => {
	it( 'draws the columns the widget asked for', () => {
		render( <BarChartSkeleton columns={ 2 } /> );

		expect( screen.getByTestId( 'widget-skeleton' ) ).toBeInTheDocument();
		expect( screen.getAllByTestId( 'skeleton-bar-column' ) ).toHaveLength( 2 );
	} );

	it( 'falls back to a handful of columns when the widget cannot count its bars', () => {
		// Only `sales-by-device` builds its bars from the response, so the default
		// just has to read as a small categorical chart, not a dense time series.
		render( <BarChartSkeleton /> );

		expect( screen.getAllByTestId( 'skeleton-bar-column' ) ).toHaveLength( 4 );
	} );

	it( "keeps the columns out of the skeleton root's direct children", () => {
		// The heights are written with `:nth-child()`, which would count
		// `SkeletonRoot`'s visually hidden label and shift every column.
		render( <BarChartSkeleton /> );

		const [ firstColumn ] = screen.getAllByTestId( 'skeleton-bar-column' );

		// eslint-disable-next-line testing-library/no-node-access -- the assertion is about which element the columns are indexed within.
		expect( firstColumn.parentElement ).not.toHaveAttribute( 'data-testid', 'widget-skeleton' );
	} );
} );
