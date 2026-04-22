import { render, screen, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import BehaviorTab from '..';

jest.mock( '@wordpress/api-fetch' );

describe( 'BehaviorTab', () => {
	it( 'shows loading state initially', () => {
		apiFetch.mockImplementationOnce( () => new Promise( () => {} ) );
		render( <BehaviorTab /> );
		expect( screen.getByText( 'Loading…' ) ).toBeInTheDocument();
	} );

	it( 'populates textarea from existing post', async () => {
		apiFetch.mockResolvedValueOnce( [ { id: 1, content: { raw: 'Focus on products.' } } ] );
		render( <BehaviorTab /> );
		await waitFor( () =>
			expect( screen.getByRole( 'textbox' ) ).toHaveValue( 'Focus on products.' )
		);
	} );

	it( 'shows empty textarea when no post exists', async () => {
		apiFetch.mockResolvedValueOnce( [] );
		render( <BehaviorTab /> );
		await waitFor( () => expect( screen.getByRole( 'textbox' ) ).toHaveValue( '' ) );
	} );
} );
