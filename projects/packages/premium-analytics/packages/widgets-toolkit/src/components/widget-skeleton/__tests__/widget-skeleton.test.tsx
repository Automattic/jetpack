/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { GenericSkeleton, SkeletonRoot } from '../index';

describe( 'SkeletonRoot', () => {
	it( 'labels the placeholder without making it a live region', () => {
		render(
			<SkeletonRoot>
				<div data-testid="shape" />
			</SkeletonRoot>
		);

		const root = screen.getByTestId( 'widget-skeleton' );
		// Both halves matter, and `role` alone does not cover the first: any of these
		// attributes would make the placeholder speak on mount.
		expect( root ).not.toHaveAttribute( 'role' );
		expect( root ).not.toHaveAttribute( 'aria-live' );
		expect( root ).not.toHaveAttribute( 'aria-busy' );
		expect( root ).not.toHaveAttribute( 'aria-hidden' );
		expect( root ).toHaveTextContent( 'Loading' );
		expect( screen.getByTestId( 'shape' ) ).toBeInTheDocument();
	} );

	it( 'keeps the hidden label out of the shape sequence', () => {
		render(
			<SkeletonRoot>
				<div className="rows" />
			</SkeletonRoot>
		);

		const root = screen.getByTestId( 'widget-skeleton' );
		// eslint-disable-next-line testing-library/no-node-access -- child order is the assertion.
		const children = Array.from( root.children );
		expect( children ).toHaveLength( 2 );
		expect( children[ 0 ] ).toHaveAttribute( 'data-visually-hidden' );
	} );
} );

describe( 'GenericSkeleton', () => {
	it( 'renders four placeholder lines', () => {
		render( <GenericSkeleton /> );

		expect( screen.getByTestId( 'widget-skeleton' ) ).toBeInTheDocument();
		expect( screen.getAllByTestId( 'skeleton-line' ) ).toHaveLength( 4 );
	} );
} );
