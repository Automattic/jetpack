import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createReduxStore, RegistryProvider, createRegistry } from '@wordpress/data';
import ContentCreationCard from '../content-creation-card';
import CustomizeLinksCard from '../customize-links-card';
import CustomizeMediaCard from '../customize-media-card';

// `@wordpress/jest-console` augments the global jest matchers at runtime, but
// the package typecheck doesn't pick up its types — declare the one we use.
declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace jest {
		interface Matchers< R > {
			toHaveErrored(): R;
		}
	}
}

const SOCIAL_STORE = 'jetpack-social';

// The cards import the real social store only for its `store` descriptor,
// which we swap for a lightweight stand-in registered below so the test
// can spy on the action creators the toggles dispatch.
jest.mock( '../../../social-store', () => ( { store: 'jetpack-social' } ) );

// The media card mounts the heavy template-picker tree behind its toggle;
// stub it so the test isolates the toggle → dispatch behavior.
jest.mock( '../../social-image-generator/template-picker/modal', () => () => (
	<div data-testid="template-picker-modal" />
) );

// Action-creator spies, shared across the per-test registry. They double as
// thunk-style action creators: returning a plain object keeps @wordpress/data
// happy when the bound dispatch runs them.
const actionSpies = {
	updateSocialImageGeneratorConfig: jest.fn( () => ( { type: 'NOOP' } ) ),
	updateUtmSettings: jest.fn( () => ( { type: 'NOOP' } ) ),
	toggleSocialNotes: jest.fn( () => ( { type: 'NOOP' } ) ),
	updateSocialNotesConfig: jest.fn( () => ( { type: 'NOOP' } ) ),
};

let registry: ReturnType< typeof createRegistry >;

/**
 * Build a registry whose social store exposes `getSocialSettings` /
 * `isSavingSiteSettings` reading the supplied state and the spied action
 * creators above, then render `ui` inside it.
 *
 * @param ui         - The card element under test.
 * @param settings   - Partial social settings the cards read.
 * @param [isSaving] - Whether a site save is in flight (drives `disabled`).
 * @return The Testing Library render result.
 */
function renderCard( ui: JSX.Element, settings: Record< string, unknown >, isSaving = false ) {
	registry = createRegistry();

	const store = createReduxStore( SOCIAL_STORE, {
		reducer: ( state = {} ) => state,
		actions: actionSpies,
		selectors: {
			getSocialSettings: () => settings,
			isSavingSiteSettings: () => isSaving,
		},
	} );

	registry.register( store );

	return render( <RegistryProvider value={ registry }>{ ui }</RegistryProvider> );
}

afterEach( () => {
	jest.clearAllMocks();
} );

describe( 'CustomizeMediaCard', () => {
	it( 'toggling the SIG control dispatches updateSocialImageGeneratorConfig with the new enabled value', async () => {
		renderCard( <CustomizeMediaCard />, { socialImageGenerator: { enabled: false } } );

		await userEvent.click( screen.getByLabelText( 'Enable Social Image Generator' ) );

		expect( actionSpies.updateSocialImageGeneratorConfig ).toHaveBeenCalledWith( {
			enabled: true,
		} );
	} );

	it( 'disables the toggle while a save is in flight', () => {
		renderCard( <CustomizeMediaCard />, { socialImageGenerator: { enabled: true } }, true );

		expect( screen.getByLabelText( 'Enable Social Image Generator' ) ).toBeDisabled();
	} );

	it( 'reveals the template picker only when SIG is enabled', () => {
		const { unmount } = renderCard( <CustomizeMediaCard />, {
			socialImageGenerator: { enabled: false },
		} );
		expect( screen.queryByTestId( 'template-picker-modal' ) ).not.toBeInTheDocument();
		unmount();

		renderCard( <CustomizeMediaCard />, { socialImageGenerator: { enabled: true } } );
		expect( screen.getByTestId( 'template-picker-modal' ) ).toBeInTheDocument();
	} );
} );

describe( 'CustomizeLinksCard', () => {
	it( 'toggling the UTM control dispatches updateUtmSettings with the new enabled value', async () => {
		renderCard( <CustomizeLinksCard />, { utmSettings: { enabled: false } } );

		await userEvent.click( screen.getByLabelText( 'Append UTM parameters to shared URLs' ) );

		expect( actionSpies.updateUtmSettings ).toHaveBeenCalledWith( { enabled: true } );
	} );

	it( 'reflects the saved enabled state and disables while saving', () => {
		renderCard( <CustomizeLinksCard />, { utmSettings: { enabled: true } }, true );

		const toggle = screen.getByLabelText( 'Append UTM parameters to shared URLs' );
		expect( toggle ).toBeChecked();
		expect( toggle ).toBeDisabled();
	} );
} );

describe( 'ContentCreationCard', () => {
	const notesSettings = ( overrides = {} ) => ( {
		socialNotes: { enabled: false, config: {}, ...overrides },
	} );

	it( 'toggling Social Notes dispatches toggleSocialNotes with the new value', async () => {
		renderCard( <ContentCreationCard />, notesSettings() );

		await userEvent.click( screen.getByLabelText( 'Enable Social Notes' ) );

		expect( actionSpies.toggleSocialNotes ).toHaveBeenCalledWith( true );
	} );

	it( 'shows the nested options only when Social Notes is enabled, and the append-link toggle dispatches the config update', async () => {
		renderCard(
			<ContentCreationCard />,
			notesSettings( { enabled: true, config: { append_link: true } } )
		);

		// The append-link toggle is only rendered while Social Notes is on.
		await userEvent.click( screen.getByLabelText( 'Append post link' ) );

		expect( actionSpies.updateSocialNotesConfig ).toHaveBeenCalledWith( { append_link: false } );
	} );

	it( 'hides the nested options while Social Notes is off', () => {
		renderCard( <ContentCreationCard />, notesSettings( { enabled: false } ) );

		expect( screen.queryByLabelText( 'Append post link' ) ).not.toBeInTheDocument();
	} );
} );
