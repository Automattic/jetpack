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

		// A `role="status"` mounting with its text already in place is never
		// announced, so the label is only there for a reader who navigates onto it.
		expect( screen.queryByRole( 'status' ) ).not.toBeInTheDocument();
		expect( screen.getByTestId( 'widget-skeleton' ) ).toHaveTextContent( 'Loading' );
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
