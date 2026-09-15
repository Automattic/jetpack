/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { HeatmapSkeleton } from '../heatmap-skeleton';

describe( 'HeatmapSkeleton', () => {
	it( "draws the design's 28 by 3 grid", () => {
		render( <HeatmapSkeleton /> );

		expect( screen.getByTestId( 'widget-skeleton' ) ).toBeInTheDocument();
		expect( screen.getAllByTestId( 'skeleton-cell' ) ).toHaveLength( 84 );
	} );

	it( 'keeps the cells in their own wrapper', () => {
		// SkeletonRoot's hidden label is a real element; cells sharing its parent
		// would take a grid slot.
		render( <HeatmapSkeleton /> );

		const root = screen.getByTestId( 'widget-skeleton' );
		// eslint-disable-next-line testing-library/no-node-access -- the wrapper is the assertion: the grid must be one element beside the hidden label.
		expect( root.children ).toHaveLength( 2 );
	} );
} );
