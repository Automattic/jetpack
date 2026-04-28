import { render, screen, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import BehaviorTab from '..';

jest.mock( '@wordpress/api-fetch' );

describe( 'PersonalityTab', () => {
	it( 'shows loading state initially', () => {
		apiFetch.mockImplementationOnce( () => new Promise( () => {} ) );
		render( <BehaviorTab /> );
		expect( screen.getByText( 'Loading…' ) ).toBeInTheDocument();
	} );

	it( 'populates textarea from existing guidelines', async () => {
		apiFetch.mockResolvedValueOnce( {
			id: 1,
			guideline_categories: {
				blocks: { 'jetpack/search-ai-summary': { guidelines: 'Focus on products.' } },
			},
		} );
		render( <BehaviorTab /> );
		await waitFor( () =>
			expect( screen.getByRole( 'textbox' ) ).toHaveValue( 'Focus on products.' )
		);
	} );

	it( 'shows empty textarea when no guidelines exist yet', async () => {
		apiFetch.mockResolvedValueOnce( { id: 0, guideline_categories: {} } );
		render( <BehaviorTab /> );
		await waitFor( () => expect( screen.getByRole( 'textbox' ) ).toHaveValue( '' ) );
	} );
} );
