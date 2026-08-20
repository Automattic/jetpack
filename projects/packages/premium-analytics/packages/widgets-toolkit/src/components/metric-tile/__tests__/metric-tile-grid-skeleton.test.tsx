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
		// Callers pass a count they know before the response, but it is 0 when
		// the user has deselected every metric — drawing that literally would
		// leave an empty loading state.
		render( <MetricTileGridSkeleton tiles={ 0 } /> );

		expect( screen.getAllByTestId( 'skeleton-tile' ).length ).toBeGreaterThan( 1 );
	} );
} );
