import { currentUserCan, siteHasFeature } from '@automattic/jetpack-script-data';
import { render, screen } from '@testing-library/react';
import SettingsTab from '..';
import { getSocialScriptData } from '../../../utils';

// Stub the card children so this test isolates SettingsTab's gating matrix —
// which cards render under which site conditions. Publicize on/off is no
// longer handled here: the page-level ActivationGate intercepts the inactive
// state before this tab renders (see social-gate/use-social-gate).
jest.mock( '../default-share-message-card', () => () => (
	<div data-testid="default-share-message-card" />
) );
jest.mock( '../content-creation-card', () => () => <div data-testid="content-creation-card" /> );
jest.mock( '../customize-media-card', () => () => <div data-testid="customize-media-card" /> );
jest.mock( '../customize-links-card', () => () => <div data-testid="customize-links-card" /> );

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

const mockCurrentUserCan = currentUserCan as jest.Mock;
const mockSiteHasFeature = siteHasFeature as jest.Mock;
const mockGetSocialScriptData = getSocialScriptData as jest.Mock;

/**
 * Configure the site conditions SettingsTab reads. Unset keys default to a
 * paid, Social-plugin, admin site.
 *
 * @param overrides                     - Site state to override the defaults with.
 * @param overrides.socialPluginVersion - The Social plugin version (null when the plugin is inactive).
 * @param overrides.manageOptions       - Whether the current user has the manage_options capability.
 * @param overrides.features            - Map of paid feature slugs to whether the site has them.
 */
function setupSite(
	overrides: {
		socialPluginVersion?: string | null;
		manageOptions?: boolean;
		features?: Record< string, boolean >;
	} = {}
) {
	const {
		socialPluginVersion = '1.0.0',
		manageOptions = true,
		features = { 'social-image-generator': true, 'social-message-templates': true },
	} = overrides;

	mockGetSocialScriptData.mockReturnValue( {
		plugin_info: { social: { version: socialPluginVersion } },
	} );
	mockCurrentUserCan.mockImplementation( cap =>
		cap === 'manage_options' ? manageOptions : false
	);
	mockSiteHasFeature.mockImplementation( feature => features[ feature ] ?? false );
}

afterEach( () => {
	jest.clearAllMocks();
} );

describe( 'SettingsTab', () => {
	it( 'always renders the Customize links card', () => {
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
