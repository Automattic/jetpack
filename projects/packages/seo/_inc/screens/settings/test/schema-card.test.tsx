import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import SchemaCard from '../schema-card';

describe( 'SchemaCard', () => {
	it( 'renders the Schema section', () => {
		render( <SchemaCard /> );

		expect( screen.getByRole( 'button', { name: /Schema/ } ) ).toBeInTheDocument();
	} );

	it( 'is collapsed by default', () => {
		render( <SchemaCard /> );

		expect( screen.getByRole( 'button', { name: /Schema/ } ) ).toHaveAttribute(
			'aria-expanded',
			'false'
		);
	} );

	it( 'expands when the header is clicked', () => {
		render( <SchemaCard /> );

		const trigger = screen.getByRole( 'button', { name: /Schema/ } );
		// eslint-disable-next-line testing-library/prefer-user-event -- fireEvent keeps this off the @testing-library/user-event devDep (avoids lockfile churn) for a single click.
		fireEvent.click( trigger );

		expect( trigger ).toHaveAttribute( 'aria-expanded', 'true' );
	} );
} );
