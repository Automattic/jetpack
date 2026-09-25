/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { DonutChartSkeleton } from '../donut-chart-skeleton';

describe( 'DonutChartSkeleton', () => {
	it( "draws the design's ring and four legend rows", () => {
		render( <DonutChartSkeleton /> );

		expect( screen.getByTestId( 'widget-skeleton' ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'skeleton-ring' ) ).toBeInTheDocument();
		expect( screen.getAllByTestId( 'skeleton-legend-row' ) ).toHaveLength( 4 );
	} );

	it( 'keeps the shape in its own wrapper', () => {
		// SkeletonRoot's hidden label is a real element; the ring sharing its
		// parent would place the label beside it in the row layout.
		render( <DonutChartSkeleton /> );

		const root = screen.getByTestId( 'widget-skeleton' );
		// eslint-disable-next-line testing-library/no-node-access -- the wrapper is the assertion: the shape must be one element beside the hidden label.
		expect( root.children ).toHaveLength( 2 );
	} );
} );
