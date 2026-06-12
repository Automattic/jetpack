import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createReduxStore, RegistryProvider, createRegistry } from '@wordpress/data';
import ActivationGate from '../activation-gate';

const SOCIAL_STORE = 'jetpack-social';
const TOGGLE_LABEL = 'Automatically share your posts to social networks';

let mockIsWpcomPlatform = false;
let mockHasPaid = false;

// The gate imports the real social store only for its `store` descriptor,
// which we swap for a lightweight stand-in registered below so the test can
// spy on the action the toggle dispatches (mirrors settings-tab/cards.test).
jest.mock( '../../../social-store', () => ( { store: 'jetpack-social' } ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: () => ( {
		site: { wpcom: { blog_id: 1 }, host: 'jetpack', suffix: 'example.com' },
	} ),
	isWpcomPlatformSite: () => mockIsWpcomPlatform,
} ) );
jest.mock( '@automattic/jetpack-components/tools/jp-redirect', () => ( {
	__esModule: true,
	default: () => 'https://example.com/redirect',
} ) );
jest.mock( '../../../utils', () => ( {
	// is_publicize_enabled true so onEnable does not call window.location.reload().
	getSocialScriptData: () => ( { is_publicize_enabled: true } ),
	getRefreshPlanQuery: () => '',
	hasSocialPaidFeatures: () => mockHasPaid,
} ) );

const actionSpies = {
	updateSocialModuleSettings: jest.fn( () => ( { type: 'NOOP' } ) ),
};

let registry: ReturnType< typeof createRegistry >;

/**
 * Render the gate inside a registry whose social store exposes
 * `isSavingSocialModuleSettings` and the spied `updateSocialModuleSettings`
 * action creator.
 *
 * @param [isSaving] - Whether a module save is in flight (drives `disabled`).
 * @return The Testing Library render result.
 */
function renderGate( isSaving = false ) {
	registry = createRegistry();

	const store = createReduxStore( SOCIAL_STORE, {
		reducer: ( state = {} ) => state,
		actions: actionSpies,
		selectors: {
			isSavingSocialModuleSettings: () => isSaving,
		},
	} );

	registry.register( store );

	return render( <RegistryProvider value={ registry }>{ <ActivationGate /> }</RegistryProvider> );
}

afterEach( () => {
	jest.clearAllMocks();
} );

describe( 'ActivationGate', () => {
	beforeEach( () => {
		mockIsWpcomPlatform = false;
		mockHasPaid = false;
	} );

	it( 'renders the educational hero and the "Did you know?" stats', () => {
		renderGate();
		expect( screen.getByText( 'Write once, post everywhere' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Did you know?' ) ).toBeInTheDocument();
		expect( screen.getByText( '40x' ) ).toBeInTheDocument();
		expect( screen.getByText( '10x' ) ).toBeInTheDocument();
	} );

	it( 'enables Publicize when the toggle is switched on', async () => {
		renderGate();
		await userEvent.click( screen.getByLabelText( TOGGLE_LABEL ) );
		expect( actionSpies.updateSocialModuleSettings ).toHaveBeenCalledWith( { publicize: true } );
	} );

	it( 'disables the toggle while a save is in flight', () => {
		renderGate( true );
		expect( screen.getByLabelText( TOGGLE_LABEL ) ).toBeDisabled();
	} );

	// Query the upsell link by role (not text): the `Notice` mirrors its copy
	// into a global `aria-live` region that persists across renders, so a text
	// query would match that leftover announcement even when nothing is shown.
	it( 'shows the upsell on a self-hosted free site', () => {
		renderGate();
		expect( screen.getByRole( 'link', { name: /power up jetpack social/i } ) ).toBeInTheDocument();
	} );

	it( 'hides the upsell when the site has paid features', () => {
		mockHasPaid = true;
		renderGate();
		expect(
			screen.queryByRole( 'link', { name: /power up jetpack social/i } )
		).not.toBeInTheDocument();
	} );

	it( 'hides the upsell on a WPcom platform site', () => {
		mockIsWpcomPlatform = true;
		renderGate();
		expect(
			screen.queryByRole( 'link', { name: /power up jetpack social/i } )
		).not.toBeInTheDocument();
	} );
} );
