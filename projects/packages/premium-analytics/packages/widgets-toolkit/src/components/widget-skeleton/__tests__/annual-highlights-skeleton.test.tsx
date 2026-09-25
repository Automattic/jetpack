/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { AnnualHighlightsSkeleton } from '../annual-highlights-skeleton';

describe( 'AnnualHighlightsSkeleton', () => {
	it( "draws the design's four rows", () => {
		render( <AnnualHighlightsSkeleton /> );

		expect( screen.getByTestId( 'widget-skeleton' ) ).toBeInTheDocument();
		expect( screen.getAllByTestId( 'skeleton-row' ) ).toHaveLength( 4 );
	} );

	it( 'keeps the rows in their own wrapper', () => {
		// SkeletonRoot's hidden label is a real element; rows sharing its parent
		// would take a share of the row gap.
		render( <AnnualHighlightsSkeleton /> );

		const root = screen.getByTestId( 'widget-skeleton' );
		// eslint-disable-next-line testing-library/no-node-access -- the wrapper is the assertion: the rows must be one element beside the hidden label.
		expect( root.children ).toHaveLength( 2 );
	} );
} );
