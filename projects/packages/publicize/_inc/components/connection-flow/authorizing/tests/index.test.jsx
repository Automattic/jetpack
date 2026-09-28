import { render, screen } from '@testing-library/react';
import { Authorizing } from '..';

// The step is body-only; the connection-flow modal owns the Dialog chrome.
describe( 'Authorizing', () => {
	test( 'announces the pending state while the popup is open', () => {
		render( <Authorizing /> );

		expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'Connecting account…' );
	} );
} );
