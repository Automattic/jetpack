import { render, screen } from 'test/test-utils';
import Search from '../search';
import { buildInitialState } from './fixtures';

describe( 'Performance tab', () => {
	it( 'links to the Search dashboard', () => {
		render( <Search />, { initialState: buildInitialState() } );

		const link = screen.getByRole( 'link', { name: 'Manage Search settings' } );
		expect( link ).toBeInTheDocument();
		expect( link ).toHaveAttribute( 'href', 'admin.php?page=jetpack-search#/settings' );
	} );

	it( 'hides the Search dashboard link in offline mode', () => {
		render( <Search />, { initialState: buildInitialState( { offlineMode: true } ) } );

		expect(
			screen.queryByRole( 'link', { name: 'Manage Search settings' } )
		).not.toBeInTheDocument();
		expect( screen.getByText( 'Unavailable in Offline Mode' ) ).toBeInTheDocument();
	} );
} );
