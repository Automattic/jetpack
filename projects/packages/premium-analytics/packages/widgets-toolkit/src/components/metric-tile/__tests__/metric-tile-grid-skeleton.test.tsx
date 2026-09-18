/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { MetricTileGridSkeleton } from '../metric-tile-grid-skeleton';

describe( 'MetricTileGridSkeleton', () => {
	afterEach( () => {
		jest.restoreAllMocks();
	} );

	it( 'draws the tiles the widget asked for', () => {
		render( <MetricTileGridSkeleton tiles={ 3 } /> );

		expect( screen.getAllByTestId( 'skeleton-tile' ) ).toHaveLength( 3 );
	} );

	it( 'lays the placeholders out the way the loaded grid will', () => {
		jest.spyOn( HTMLElement.prototype, 'getBoundingClientRect' ).mockReturnValue( {
			width: 580,
			height: 326,
			top: 0,
			left: 0,
			right: 580,
			bottom: 326,
			x: 0,
			y: 0,
			toJSON: () => ( {} ),
		} );

		render(
			<div style={ { gridColumnEnd: 'span 2' } }>
				<MetricTileGridSkeleton tiles={ 4 } />
			</div>
		);

		expect( screen.getByTestId( 'skeleton-tiles' ) ).toHaveAttribute( 'data-layout', 'grid' );
	} );

	it( 'fills the grid when every metric is switched off', () => {
		// The caller's known count is 0 when every metric is deselected; drawing
		// that literally would leave an empty loading state.
		render( <MetricTileGridSkeleton tiles={ 0 } /> );

		expect( screen.getAllByTestId( 'skeleton-tile' ).length ).toBeGreaterThan( 1 );
	} );
} );
