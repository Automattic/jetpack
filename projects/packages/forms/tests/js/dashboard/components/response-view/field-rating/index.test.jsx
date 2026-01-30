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
		it( 'renders 4 star icons for value "4/5"', () => {
			const { container } = render( <FieldRating value="4/5" /> );

			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const svgs = container.querySelectorAll( 'svg' );
			expect( svgs ).toHaveLength( 4 );
		} );

		it( 'renders 3 star icons for value "3/5"', () => {
			const { container } = render( <FieldRating value="3/5" /> );

			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const svgs = container.querySelectorAll( 'svg' );
			expect( svgs ).toHaveLength( 3 );
		} );

		it( 'renders 5 star icons for value "5/5"', () => {
			const { container } = render( <FieldRating value="5/5" /> );

			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const svgs = container.querySelectorAll( 'svg' );
			expect( svgs ).toHaveLength( 5 );
		} );

		it( 'renders 1 star icon for value "1/5"', () => {
			const { container } = render( <FieldRating value="1/5" /> );

			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const svgs = container.querySelectorAll( 'svg' );
			expect( svgs ).toHaveLength( 1 );
		} );

		it( 'coerces numeric value to string and renders correct number of icons', () => {
			const { container } = render( <FieldRating value={ '2/5' } /> );

			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const svgs = container.querySelectorAll( 'svg' );
			expect( svgs ).toHaveLength( 2 );
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
		it( 'renders zero icons for non-numeric rate part', () => {
			const { container } = render( <FieldRating value="abc/5" /> );

			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const svgs = container.querySelectorAll( 'svg' );
			expect( svgs ).toHaveLength( 0 );
		} );

		it( 'parses only the first segment before slash', () => {
			const { container } = render( <FieldRating value="2/10" /> );

			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const svgs = container.querySelectorAll( 'svg' );
			expect( svgs ).toHaveLength( 2 );
		} );
	} );
} );
