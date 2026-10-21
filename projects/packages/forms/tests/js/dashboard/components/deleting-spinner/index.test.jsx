/**
 * External dependencies
 */
import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';

const { default: DeletingSpinner } =
	await import( '../../../../../src/dashboard/components/deleting-spinner' );

describe( 'DeletingSpinner', () => {
	it( 'renders a decorative spinner hidden from assistive technology', () => {
		render( <DeletingSpinner /> );
		const spinner = screen.getByRole( 'presentation', { hidden: true } );

		expect( spinner ).toHaveClass( 'jp-forms-deleting-spinner' );
		expect( spinner ).toHaveAttribute( 'aria-hidden', 'true' );
	} );
} );
