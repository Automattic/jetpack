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

		expect( screen.getAllByTestId( 'skeleton-bar-column' ) ).toHaveLength( 2 );
	} );
} );
