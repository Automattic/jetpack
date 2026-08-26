/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { BarChartSkeleton } from '../bar-chart-skeleton';

describe( 'BarChartSkeleton', () => {
	it( 'draws the columns the widget asked for, inside a status region', () => {
		render( <BarChartSkeleton columns={ 2 } /> );

		expect( screen.getByRole( 'status' ) ).toBeInTheDocument();
		expect( screen.getAllByTestId( 'skeleton-bar-column' ) ).toHaveLength( 2 );
	} );

	it( 'falls back to a handful of columns when the widget cannot count its bars', () => {
		// Only `sales-by-device` builds its bars from the response; the rest
		// pass a count they know, so the default just has to read as a small
		// categorical chart rather than the prototype's dense time series.
		render( <BarChartSkeleton /> );

		expect( screen.getAllByTestId( 'skeleton-bar-column' ) ).toHaveLength( 4 );
	} );

	it( "keeps the columns out of the status region's direct children", () => {
		// The heights are written with `:nth-child()`, which would count
		// `SkeletonRoot`'s visually hidden label and shift every column.
		render( <BarChartSkeleton /> );

		const [ firstColumn ] = screen.getAllByTestId( 'skeleton-bar-column' );

		// eslint-disable-next-line testing-library/no-node-access -- the assertion is about which element the columns are indexed within.
		expect( firstColumn.parentElement ).not.toHaveAttribute( 'role', 'status' );
	} );
} );
