import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createReduxStore, RegistryProvider, createRegistry } from '@wordpress/data';
import SocialspecPromo from '../socialspec-promo';

jest.mock( '../../../social-store', () => ( { store: 'jetpack-social' } ) );

const updateSocialspecSettings = jest.fn( () => ( { type: 'NOOP' } ) );

/**
 * Render the promotion with the given SocialSpec settings.
 *
 * @param socialspec - The settings the promotion reads.
 * @return The Testing Library render result.
 */
function renderPromo( socialspec: Record< string, unknown > ) {
	const registry = createRegistry();

	registry.register(
		createReduxStore( 'jetpack-social', {
			reducer: ( state = {} ) => state,
			actions: { updateSocialspecSettings },
			selectors: {
				getSocialSettings: () => ( { socialspec } ),
				isSavingSiteSettings: () => false,
			},
		} )
	);

	return render(
		<RegistryProvider value={ registry }>
			<SocialspecPromo />
		</RegistryProvider>
	);
}

afterEach( () => {
	jest.clearAllMocks();
} );

describe( 'SocialspecPromo', () => {
	const OFF = { enabled: false, promo_dismissed: false, available: true };

	it( 'turns the profile on', async () => {
		renderPromo( OFF );

		await userEvent.click( screen.getByRole( 'button', { name: 'Turn on' } ) );

		expect( updateSocialspecSettings ).toHaveBeenCalledWith( { enabled: true } );
	} );

	it( 'can be dismissed without turning the profile on', async () => {
		renderPromo( OFF );

		await userEvent.click( screen.getByRole( 'button', { name: 'Not now' } ) );

		expect( updateSocialspecSettings ).toHaveBeenCalledWith( { promo_dismissed: true } );
	} );

	it.each( [
		[ 'the profile is on', { ...OFF, enabled: true } ],
		[ 'it was dismissed', { ...OFF, promo_dismissed: true } ],
		[ 'another plugin serves the documents', { ...OFF, available: false } ],
	] )( 'does not show when %s', ( _reason, socialspec ) => {
		const { container } = renderPromo( socialspec );

		expect( container ).toBeEmptyDOMElement();
	} );
} );
