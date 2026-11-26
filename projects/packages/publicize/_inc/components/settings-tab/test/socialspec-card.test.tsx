import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEntityRecords } from '@wordpress/core-data';
import { createReduxStore, RegistryProvider, createRegistry } from '@wordpress/data';
import SocialspecCard from '../socialspec-card';

jest.mock( '../../../social-store', () => ( { store: 'jetpack-social' } ) );

jest.mock( '@wordpress/core-data', () => ( { useEntityRecords: jest.fn() } ) );

const mockUseEntityRecords = useEntityRecords as jest.Mock;
const updateSocialspecSettings = jest.fn( () => ( { type: 'NOOP' } ) );

/**
 * Render the card with the given SocialSpec settings.
 *
 * @param socialspec - The settings the card reads.
 * @param isSaving   - Whether a site save is in flight.
 * @return The Testing Library render result.
 */
function renderCard( socialspec: Record< string, unknown >, isSaving = false ) {
	const registry = createRegistry();

	registry.register(
		createReduxStore( 'jetpack-social', {
			reducer: ( state = {} ) => state,
			actions: { updateSocialspecSettings },
			selectors: {
				getSocialSettings: () => ( { socialspec } ),
				isSavingSiteSettings: () => isSaving,
			},
		} )
	);

	return render(
		<RegistryProvider value={ registry }>
			<SocialspecCard />
		</RegistryProvider>
	);
}

beforeEach( () => {
	mockUseEntityRecords.mockReturnValue( {
		records: [
			{ id: 7, title: { rendered: 'About &amp; me' } },
			{ id: 9, title: { rendered: '' } },
		],
	} );
} );

afterEach( () => {
	jest.clearAllMocks();
} );

describe( 'SocialspecCard', () => {
	const TOGGLE = 'Share a profile of this site with feed readers and social apps';

	it( 'turns the profile on, and offers no page picker while it is off', async () => {
		renderCard( { enabled: false, about_page: 0 } );

		expect( screen.queryByLabelText( 'About page' ) ).not.toBeInTheDocument();
		// The pages are not requested for a picker that does not show.
		expect( mockUseEntityRecords.mock.calls[ 0 ][ 3 ] ).toEqual( { enabled: false } );

		await userEvent.click( screen.getByRole( 'switch', { name: TOGGLE } ) );

		expect( updateSocialspecSettings ).toHaveBeenCalledWith( { enabled: true } );
	} );

	it( 'pre-selects the page the server uses while none is picked, and saves the selected one', async () => {
		renderCard( { enabled: true, about_page: 0, default_about_page: 9 } );

		const picker = screen.getByLabelText( 'About page' );
		expect( picker ).toHaveValue( '9' );
		expect( screen.getAllByRole( 'option' ).map( option => option.textContent ) ).toEqual( [
			'About & me',
			'#9',
		] );

		await userEvent.selectOptions( picker, '7' );

		expect( updateSocialspecSettings ).toHaveBeenCalledWith( { about_page: 7 } );
	} );

	it( 'prefers the picked page, and asks to select one when there is none to pre-select', () => {
		const { unmount } = renderCard( { enabled: true, about_page: 7, default_about_page: 9 } );
		expect( screen.getByLabelText( 'About page' ) ).toHaveValue( '7' );
		unmount();

		renderCard( { enabled: true, about_page: 0, default_about_page: 0 } );
		expect( screen.getByLabelText( 'About page' ) ).toHaveValue( '' );
		expect( screen.getByRole( 'option', { name: 'Select a page' } ) ).toBeDisabled();
	} );

	it( 'disables both controls while a save is in flight', () => {
		renderCard( { enabled: true, about_page: 7 }, true );

		expect( screen.getByRole( 'switch', { name: TOGGLE } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		expect( screen.getByLabelText( 'About page' ) ).toBeDisabled();
	} );
} );
