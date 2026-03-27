/**
 * External dependencies
 */
import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
const { default: FieldRating } = await import(
	'../../../../../../src/dashboard/components/inspector/response-fields/field-rating/index.tsx'
);

describe( 'FieldRating', () => {
	describe( 'Valid rating values', () => {
		it( 'renders 5 icons with 4 filled for value "4/5"', () => {
			const { container } = render( <FieldRating value="4/5" /> );

			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const svgs = container.querySelectorAll( 'svg' );
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const filledPaths = container.querySelectorAll( 'path[fill="#F0B849"]' );
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const emptyPaths = container.querySelectorAll( 'path[fill="none"]' );
			expect( svgs ).toHaveLength( 5 );
			expect( filledPaths ).toHaveLength( 4 );
			expect( emptyPaths ).toHaveLength( 1 );
		} );

		it( 'renders 5 icons with 3 filled for value "3/5"', () => {
			const { container } = render( <FieldRating value="3/5" /> );

			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const svgs = container.querySelectorAll( 'svg' );
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const filledPaths = container.querySelectorAll( 'path[fill="#F0B849"]' );
			expect( svgs ).toHaveLength( 5 );
			expect( filledPaths ).toHaveLength( 3 );
		} );

		it( 'renders 5 icons all filled for value "5/5"', () => {
			const { container } = render( <FieldRating value="5/5" /> );

			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const svgs = container.querySelectorAll( 'svg' );
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const filledPaths = container.querySelectorAll( 'path[fill="#F0B849"]' );
			expect( svgs ).toHaveLength( 5 );
			expect( filledPaths ).toHaveLength( 5 );
		} );

		it( 'renders 5 icons with 1 filled for value "1/5"', () => {
			const { container } = render( <FieldRating value="1/5" /> );

			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const svgs = container.querySelectorAll( 'svg' );
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const filledPaths = container.querySelectorAll( 'path[fill="#F0B849"]' );
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const emptyPaths = container.querySelectorAll( 'path[fill="none"]' );
			expect( svgs ).toHaveLength( 5 );
			expect( filledPaths ).toHaveLength( 1 );
			expect( emptyPaths ).toHaveLength( 4 );
		} );

		it( 'renders 5 icons with 2 filled for value "2/5"', () => {
			const { container } = render( <FieldRating value="2/5" /> );

			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const svgs = container.querySelectorAll( 'svg' );
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const filledPaths = container.querySelectorAll( 'path[fill="#F0B849"]' );
			expect( svgs ).toHaveLength( 5 );
			expect( filledPaths ).toHaveLength( 2 );
		} );
	} );

	describe( 'Invalid and empty values fall back to "-"', () => {
		it( 'renders "-" for null value', () => {
			render( <FieldRating value={ null } /> );

			expect( screen.getByText( '-' ) ).toBeInTheDocument();
		} );

		it( 'renders "-" for undefined value', () => {
			render( <FieldRating /> );

			expect( screen.getByText( '-' ) ).toBeInTheDocument();
		} );

		it( 'renders "-" for empty string', () => {
			render( <FieldRating value="" /> );

			expect( screen.getByText( '-' ) ).toBeInTheDocument();
		} );

		it( 'renders "-" for whitespace-only value', () => {
			render( <FieldRating value="   " /> );

			expect( screen.getByText( '-' ) ).toBeInTheDocument();
		} );

		it( 'renders "-" when value has no rate part (e.g. "/5")', () => {
			render( <FieldRating value="/5" /> );

			expect( screen.getByText( '-' ) ).toBeInTheDocument();
		} );

		it( 'renders "-" when rate part is whitespace only', () => {
			render( <FieldRating value="  /5" /> );

			expect( screen.getByText( '-' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Edge cases', () => {
		it( 'falls back to "-" for non-numeric rate part', () => {
			render( <FieldRating value="abc/5" /> );

			expect( screen.getByText( '-' ) ).toBeInTheDocument();
		} );

		it( 'falls back to "-" for non-numeric max part', () => {
			render( <FieldRating value="3/abc" /> );

			expect( screen.getByText( '-' ) ).toBeInTheDocument();
		} );

		it( 'falls back to "-" for partial numeric rate (e.g. "4abc/5")', () => {
			render( <FieldRating value="4abc/5" /> );

			expect( screen.getByText( '-' ) ).toBeInTheDocument();
		} );

		it( 'falls back to "-" for partial numeric max (e.g. "3/5abc")', () => {
			render( <FieldRating value="3/5abc" /> );

			expect( screen.getByText( '-' ) ).toBeInTheDocument();
		} );

		it( 'clamps rating to max (e.g. 7/5 shows 5 filled icons)', () => {
			const { container } = render( <FieldRating value="7/5" /> );

			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const svgs = container.querySelectorAll( 'svg' );
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const filledPaths = container.querySelectorAll( 'path[fill="#F0B849"]' );
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const emptyPaths = container.querySelectorAll( 'path[fill="none"]' );
			expect( svgs ).toHaveLength( 5 );
			expect( filledPaths ).toHaveLength( 5 );
			expect( emptyPaths ).toHaveLength( 0 );
		} );

		it( 'renders correct icons for different max values (e.g. "2/10")', () => {
			const { container } = render( <FieldRating value="2/10" /> );

			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const svgs = container.querySelectorAll( 'svg' );
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const filledPaths = container.querySelectorAll( 'path[fill="#F0B849"]' );
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const emptyPaths = container.querySelectorAll( 'path[fill="none"]' );
			expect( svgs ).toHaveLength( 10 );
			expect( filledPaths ).toHaveLength( 2 );
			expect( emptyPaths ).toHaveLength( 8 );
		} );

		it( 'clamps max to 10 icons to prevent DOM bloat (e.g. "50/100")', () => {
			const { container } = render( <FieldRating value="50/100" /> );

			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const svgs = container.querySelectorAll( 'svg' );
			// Should render max 10 icons, all filled since 50 > 10
			expect( svgs ).toHaveLength( 10 );
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const filledPaths = container.querySelectorAll( 'path[fill="#F0B849"]' );
			expect( filledPaths ).toHaveLength( 10 );
		} );
	} );
} );
