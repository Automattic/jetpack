import { currentUserCan, siteHasFeature } from '@automattic/jetpack-script-data';
import { render, screen } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import SettingsTab from '..';
import { getSocialScriptData } from '../../../utils';
import { canToggleSocialModule } from '../../../utils/misc';
import { useTurnOnSocial } from '../turn-on-social-context';

// Avoid pulling the real social store (and its @wordpress/editor imports)
// into the test.
jest.mock( '../../../social-store', () => ( { store: 'jetpack-social' } ) );

// Stub the card children + empty state so this test isolates SettingsTab's
// gating matrix — which cards render under which site conditions. Stubbing
// social-module-card also keeps the @wordpress/components barrel (which it
// pulls in for ToggleControl) out of this suite's module graph.
jest.mock( '../default-share-message-card', () => () => (
	<div data-testid="default-share-message-card" />
) );
jest.mock( '../content-creation-card', () => () => <div data-testid="content-creation-card" /> );
jest.mock( '../customize-media-card', () => () => <div data-testid="customize-media-card" /> );
jest.mock( '../customize-links-card', () => () => <div data-testid="customize-links-card" /> );
jest.mock( '../social-module-card', () => () => <div data-testid="social-module-card" /> );
jest.mock( '../publicize-inactive-empty-state', () => () => (
	<div data-testid="publicize-inactive-empty-state" />
) );

jest.mock( '../turn-on-social-context', () => ( { useTurnOnSocial: jest.fn() } ) );

jest.mock( '@wordpress/data', () => ( { useSelect: jest.fn() } ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	currentUserCan: jest.fn(),
	siteHasFeature: jest.fn(),
} ) );

jest.mock( '../../../utils', () => ( {
	features: {
		IMAGE_GENERATOR: 'social-image-generator',
		MESSAGE_TEMPLATES: 'social-message-templates',
	},
	getSocialScriptData: jest.fn(),
} ) );

jest.mock( '../../../utils/misc', () => ( { canToggleSocialModule: jest.fn() } ) );

const mockUseSelect = useSelect as jest.Mock;
const mockCurrentUserCan = currentUserCan as jest.Mock;
const mockSiteHasFeature = siteHasFeature as jest.Mock;
const mockGetSocialScriptData = getSocialScriptData as jest.Mock;
const mockCanToggleSocialModule = canToggleSocialModule as jest.Mock;
const mockUseTurnOnSocial = useTurnOnSocial as jest.Mock;

/**
 * Configure the site conditions SettingsTab reads. Unset keys default to a
 * paid, Social-plugin, admin site with Publicize active.
 *
 * @param overrides                     - Site state to override the defaults with.
 * @param overrides.publicizeActive     - Whether the Publicize module is active.
 * @param overrides.canToggle           - Whether the current user can toggle Social modules.
 * @param overrides.socialPluginVersion - The Social plugin version (null when the plugin is inactive).
 * @param overrides.manageOptions       - Whether the current user has the manage_options capability.
 * @param overrides.features            - Map of paid feature slugs to whether the site has them.
 * @param overrides.isEnabling          - Whether Social is mid-way through being turned on.
 */
function setupSite(
	overrides: {
		publicizeActive?: boolean;
		canToggle?: boolean;
		socialPluginVersion?: string | null;
		manageOptions?: boolean;
		features?: Record< string, boolean >;
		isEnabling?: boolean;
	} = {}
) {
	const {
		publicizeActive = true,
		canToggle = true,
		socialPluginVersion = '1.0.0',
		manageOptions = true,
		features = { 'social-image-generator': true, 'social-message-templates': true },
		isEnabling = false,
	} = overrides;

	// SettingsTab's single useSelect derives `publicize` from the store.
	mockUseSelect.mockImplementation( ( mapSelect: ( select: unknown ) => unknown ) =>
		mapSelect( () => ( {
			getSocialModuleSettings: () => ( { publicize: publicizeActive } ),
		} ) )
	);
	mockCanToggleSocialModule.mockReturnValue( canToggle );
	mockGetSocialScriptData.mockReturnValue( {
		plugin_info: { social: { version: socialPluginVersion } },
	} );
	mockCurrentUserCan.mockImplementation( cap =>
		cap === 'manage_options' ? manageOptions : false
	);
	mockSiteHasFeature.mockImplementation( feature => features[ feature ] ?? false );
	mockUseTurnOnSocial.mockReturnValue( { isEnabling, turnOn: jest.fn() } );
}

afterEach( () => {
	jest.clearAllMocks();
} );

describe( 'SettingsTab', () => {
	it( 'shows the empty state (and no cards) when Publicize is off and the user can toggle modules', () => {
		setupSite( { publicizeActive: false, canToggle: true } );

		render( <SettingsTab /> );

		expect( screen.getByTestId( 'publicize-inactive-empty-state' ) ).toBeInTheDocument();
		expect( screen.queryByTestId( 'customize-links-card' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the cards (not the empty state) when Publicize is off but the user cannot toggle modules', () => {
		setupSite( { publicizeActive: false, canToggle: false } );

		render( <SettingsTab /> );

		expect( screen.queryByTestId( 'publicize-inactive-empty-state' ) ).not.toBeInTheDocument();
		expect( screen.getByTestId( 'customize-links-card' ) ).toBeInTheDocument();
	} );

	it( 'keeps the empty state (not the cards) while Social is being turned on, even though the store already reports it active', () => {
		// During enable the module flips active optimistically; the turn-on latch
		// must hold the empty state until the reload so the cards don't flicker in.
		setupSite( { publicizeActive: true, canToggle: true, isEnabling: true } );

		render( <SettingsTab /> );

		expect( screen.getByTestId( 'publicize-inactive-empty-state' ) ).toBeInTheDocument();
		expect( screen.queryByTestId( 'customize-links-card' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the Social module toggle card when Publicize is active and the user can toggle modules', () => {
		setupSite( { publicizeActive: true, canToggle: true } );

		render( <SettingsTab /> );

		expect( screen.getByTestId( 'social-module-card' ) ).toBeInTheDocument();
	} );

	it( 'hides the Social module toggle card when the user cannot toggle modules', () => {
		setupSite( { publicizeActive: true, canToggle: false } );

		render( <SettingsTab /> );

		expect( screen.queryByTestId( 'social-module-card' ) ).not.toBeInTheDocument();
		expect( screen.getByTestId( 'customize-links-card' ) ).toBeInTheDocument();
	} );

	it( 'always renders the Customize links card when Publicize is active', () => {
		setupSite();

		render( <SettingsTab /> );

		expect( screen.getByTestId( 'customize-links-card' ) ).toBeInTheDocument();
	} );

	it( 'renders the Default share message card only with the message-templates feature AND manage_options', () => {
		setupSite( { features: { 'social-message-templates': true }, manageOptions: true } );
		const { unmount } = render( <SettingsTab /> );
		expect( screen.getByTestId( 'default-share-message-card' ) ).toBeInTheDocument();
		unmount();

		setupSite( { features: { 'social-message-templates': true }, manageOptions: false } );
		render( <SettingsTab /> );
		expect( screen.queryByTestId( 'default-share-message-card' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the Content creation card only when the Social plugin is active', () => {
		setupSite( { socialPluginVersion: '1.0.0' } );
		const { unmount } = render( <SettingsTab /> );
		expect( screen.getByTestId( 'content-creation-card' ) ).toBeInTheDocument();
		unmount();

		setupSite( { socialPluginVersion: null } );
		render( <SettingsTab /> );
		expect( screen.queryByTestId( 'content-creation-card' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the Customize media card only with the image-generator feature', () => {
		setupSite( { features: { 'social-image-generator': true } } );
		const { unmount } = render( <SettingsTab /> );
		expect( screen.getByTestId( 'customize-media-card' ) ).toBeInTheDocument();
		unmount();

		setupSite( { features: { 'social-image-generator': false } } );
		render( <SettingsTab /> );
		expect( screen.queryByTestId( 'customize-media-card' ) ).not.toBeInTheDocument();
	} );
} );
