/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { MetricTileGridSkeleton } from '../metric-tile-grid-skeleton';

describe( 'MetricTileGridSkeleton', () => {
	it( 'draws the tiles the widget asked for', () => {
		render( <MetricTileGridSkeleton tiles={ 3 } /> );

		expect( screen.getAllByTestId( 'skeleton-tile' ) ).toHaveLength( 3 );
	} );

	it( 'fills the grid when every metric is switched off', () => {
		// The caller's known count is 0 when every metric is deselected; drawing
		// that literally would leave an empty loading state.
		render( <MetricTileGridSkeleton tiles={ 0 } /> );

		expect( screen.getAllByTestId( 'skeleton-tile' ).length ).toBeGreaterThan( 1 );
	} );
} );
