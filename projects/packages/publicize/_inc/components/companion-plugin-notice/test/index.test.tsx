import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { speak } from '@wordpress/a11y';
import apiFetch from '@wordpress/api-fetch';
import { CompanionPluginNotice } from '..';
import { clearMockedScriptData, mockScriptData } from '../../../utils/test-utils';
import { resetCompanionPluginStates } from '../use-companion-plugin';
import type { CompanionPlugin } from '../../../types';

jest.mock( '@wordpress/api-fetch' );
jest.mock( '@wordpress/a11y' );

const mockRecordEvent = jest.fn();
jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	...jest.requireActual( '@automattic/jetpack-shared-extension-utils' ),
	useAnalytics: () => ( { recordEvent: mockRecordEvent } ),
} ) );

const mockedApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

const atmosphere = ( overrides: Partial< CompanionPlugin > = {} ): CompanionPlugin => ( {
	slug: 'atmosphere',
	plugin: 'atmosphere/atmosphere',
	service: 'bluesky',
	action: 'install',
	install_url: '',
	settings_url: 'https://example.com/wp-admin/options-general.php?page=atmosphere',
	...overrides,
} );

const activitypub = ( overrides: Partial< CompanionPlugin > = {} ): CompanionPlugin => ( {
	slug: 'activitypub',
	plugin: 'activitypub/activitypub',
	service: 'mastodon',
	action: 'enable',
	install_url: '',
	settings_url: 'https://example.com/wp-admin/options-general.php?page=activitypub',
	...overrides,
} );

const setup = ( plugins: CompanionPlugin[], serviceName = 'bluesky' ) => {
	mockScriptData( { social: { companion_plugins: plugins } } );
	return render( <CompanionPluginNotice serviceName={ serviceName } context="admin-page" /> );
};

describe( 'CompanionPluginNotice', () => {
	beforeEach( () => {
		mockedApiFetch.mockReset();
		mockRecordEvent.mockReset();
		jest.mocked( speak ).mockReset();
	} );

	afterEach( () => {
		clearMockedScriptData();
		resetCompanionPluginStates();
	} );

	it( 'renders nothing when no plugin is offered for the network', () => {
		const { container } = setup( [ atmosphere() ], 'mastodon' );

		expect( container ).toBeEmptyDOMElement();
		expect( mockRecordEvent ).not.toHaveBeenCalled();
	} );

	it.each( [
		{
			plugin: atmosphere(),
			button: 'Install ATmosphere',
			request: {
				path: '/wp/v2/plugins',
				method: 'POST',
				data: { slug: 'atmosphere', status: 'active' },
			},
		},
		{
			plugin: atmosphere( { action: 'activate' } ),
			button: 'Activate ATmosphere',
			request: {
				path: '/wp/v2/plugins/atmosphere/atmosphere',
				method: 'PUT',
				data: { status: 'active' },
			},
		},
		{
			plugin: activitypub(),
			button: 'Turn on ActivityPub',
			request: {
				path: '/wpcom/v2/activitypub/status',
				method: 'PUT',
				data: { enabled: true },
			},
		},
	] )(
		'$button sends the matching request and links to the settings',
		async ( { plugin, button, request } ) => {
			mockedApiFetch.mockResolvedValue( {} );
			setup( [ plugin ], plugin.service );

			await userEvent.click( screen.getByRole( 'button', { name: button } ) );

			expect( mockedApiFetch ).toHaveBeenCalledWith( request );
			await expect(
				screen.findByRole( 'link', { name: 'Finish setting it up' } )
			).resolves.toHaveAttribute( 'href', plugin.settings_url );
			expect( mockRecordEvent.mock.calls.map( ( [ name ] ) => name ) ).toEqual( [
				'jetpack_social_companion_plugin_notice_view',
				'jetpack_social_companion_plugin_notice_cta_click',
				'jetpack_social_companion_plugin_notice_activated',
			] );
			expect( speak ).toHaveBeenCalledWith( expect.stringMatching( / is active\.$/ ), 'polite' );
		}
	);

	it( 'sends Simple sites to WordPress.com to install the plugin', async () => {
		const plugin = atmosphere( {
			action: 'marketplace',
			install_url: 'https://wordpress.com/plugins/atmosphere/example.wordpress.com',
		} );
		setup( [ plugin ] );
		// jsdom cannot navigate.
		const preventNavigation = ( event: Event ) => event.preventDefault();
		document.addEventListener( 'click', preventNavigation );

		const link = screen.getByRole( 'link', { name: 'Install ATmosphere' } );
		await userEvent.click( link );
		document.removeEventListener( 'click', preventNavigation );

		expect( link ).toHaveAttribute( 'href', plugin.install_url );
		expect(
			screen.getByText( /To install ATmosphere, we’ll need to move your site over/ )
		).toBeInTheDocument();
		expect( mockedApiFetch ).not.toHaveBeenCalled();
		expect( mockRecordEvent ).toHaveBeenLastCalledWith(
			'jetpack_social_companion_plugin_notice_cta_click',
			expect.objectContaining( { plugin: 'atmosphere', action: 'marketplace' } )
		);
	} );

	it( 'shows the error and keeps the button when the install fails', async () => {
		mockedApiFetch.mockRejectedValue( {
			message:
				'<p><strong>Error:</strong> Current PHP version does not meet requirements for ATmosphere&#8217;s update.</p>',
		} );
		setup( [ atmosphere() ] );

		await userEvent.click( screen.getByRole( 'button', { name: 'Install ATmosphere' } ) );

		const message =
			'ATmosphere could not be set up: Error: Current PHP version does not meet requirements for ATmosphere’s update.';
		await expect( screen.findByText( message ) ).resolves.toBeInTheDocument();
		expect( speak ).toHaveBeenCalledWith( message, 'assertive' );
		expect( screen.getByRole( 'button', { name: 'Install ATmosphere' } ) ).toBeEnabled();
		expect( mockRecordEvent ).toHaveBeenLastCalledWith(
			'jetpack_social_companion_plugin_notice_error',
			expect.objectContaining( { plugin: 'atmosphere' } )
		);
	} );

	it( 'hides every notice for the plugin and saves the dismissal', async () => {
		mockedApiFetch.mockResolvedValue( {} );
		mockScriptData( { social: { companion_plugins: [ atmosphere() ] } } );
		render(
			<>
				<CompanionPluginNotice serviceName="bluesky" context="admin-page" />
				<CompanionPluginNotice serviceName="bluesky" context="admin-page" />
			</>
		);

		await userEvent.click( screen.getAllByRole( 'button', { name: 'Dismiss' } )[ 0 ] );

		await waitFor( () =>
			expect( screen.queryByRole( 'button', { name: 'Dismiss' } ) ).not.toBeInTheDocument()
		);
		expect( mockedApiFetch ).toHaveBeenCalledWith( {
			path: '/wpcom/v2/publicize/companion-plugins/atmosphere/dismiss',
			method: 'POST',
		} );
		expect( mockRecordEvent.mock.calls.map( ( [ name ] ) => name ) ).toEqual( [
			'jetpack_social_companion_plugin_notice_view',
			'jetpack_social_companion_plugin_notice_dismiss',
		] );
	} );
} );
