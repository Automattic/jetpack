import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../index';

test( 'announces itself as a loading status', () => {
	render( <LoadingSpinner /> );

	expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'Loading' );
} );
