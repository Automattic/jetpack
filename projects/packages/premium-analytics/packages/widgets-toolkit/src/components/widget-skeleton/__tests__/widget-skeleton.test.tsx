/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { GenericSkeleton, SkeletonRoot } from '../index';

describe( 'SkeletonRoot', () => {
	it( 'announces the loading region to assistive tech', () => {
		render(
			<SkeletonRoot>
				<div data-testid="shape" />
			</SkeletonRoot>
		);

		const status = screen.getByRole( 'status' );
		expect( status ).toHaveAttribute( 'aria-busy', 'true' );
		expect( status ).toHaveTextContent( 'Loading' );
		expect( screen.getByTestId( 'shape' ) ).toBeInTheDocument();
	} );

	it( 'keeps the hidden label out of the shape sequence', () => {
		// The label is a real element. Shapes index their rows with
		// `:nth-child()`, so it must not sit among them.
		render(
			<SkeletonRoot>
				<div className="rows" />
			</SkeletonRoot>
		);

		const root = screen.getByRole( 'status' );
		// eslint-disable-next-line testing-library/no-node-access -- child order is the assertion: the hidden label has to occupy the first slot, ahead of the shape's rows.
		const children = Array.from( root.children );
		expect( children ).toHaveLength( 2 );
		expect( children[ 0 ] ).toHaveAttribute( 'data-visually-hidden' );
	} );
} );

describe( 'GenericSkeleton', () => {
	it( 'renders four placeholder lines inside a status region', () => {
		render( <GenericSkeleton /> );

		expect( screen.getByRole( 'status' ) ).toBeInTheDocument();
		expect( screen.getAllByTestId( 'skeleton-line' ) ).toHaveLength( 4 );
	} );
} );
