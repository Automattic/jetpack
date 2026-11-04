import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { speak } from '@wordpress/a11y';
import apiFetch from '@wordpress/api-fetch';
import { CompanionPluginNotice } from '..';
import { clearMockedScriptData, mockScriptData } from '../../../utils/test-utils';
import { resetCompanionPluginStates } from '../use-companion-plugin';
import type { SocialScriptData } from '../../../types';

jest.mock( '@wordpress/api-fetch' );
jest.mock( '@wordpress/a11y' );

const mockRecordEvent = jest.fn();
jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	...jest.requireActual( '@automattic/jetpack-shared-extension-utils' ),
	useAnalytics: () => ( { recordEvent: mockRecordEvent } ),
} ) );

const mockedApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

const setup = ( plugins: SocialScriptData[ 'companion_plugins' ], serviceName = 'bluesky' ) => {
	mockScriptData( {
		site: { admin_url: 'https://example.com/wp-admin/', suffix: 'example.wordpress.com' },
		social: { companion_plugins: plugins },
	} );
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
		const { container } = setup( { atmosphere: 'install' }, 'mastodon' );

		expect( container ).toBeEmptyDOMElement();
		expect( mockRecordEvent ).not.toHaveBeenCalled();
	} );

	it.each( [
		{
			service: 'bluesky',
			plugins: { atmosphere: 'install' } as const,
			button: 'Install ATmosphere',
			request: {
				path: '/wp/v2/plugins',
				method: 'POST',
				data: { slug: 'atmosphere', status: 'active' },
			},
			settings: 'https://example.com/wp-admin/options-general.php?page=atmosphere',
		},
		{
			service: 'bluesky',
			plugins: { atmosphere: 'activate' } as const,
			button: 'Activate ATmosphere',
			request: {
				path: '/wp/v2/plugins/atmosphere/atmosphere',
				method: 'PUT',
				data: { status: 'active' },
			},
			settings: 'https://example.com/wp-admin/options-general.php?page=atmosphere',
		},
		{
			service: 'mastodon',
			plugins: { activitypub: 'enable' } as const,
			button: 'Turn on ActivityPub',
			request: { path: '/wpcom/v2/activitypub/status', method: 'PUT', data: { enabled: true } },
			settings: 'https://example.com/wp-admin/options-general.php?page=activitypub',
		},
	] )(
		'$button sends the matching request and links to the settings',
		async ( { service, plugins, button, request, settings } ) => {
			mockedApiFetch.mockResolvedValue( {} );
			setup( plugins, service );

			await userEvent.click( screen.getByRole( 'button', { name: button } ) );

			expect( mockedApiFetch ).toHaveBeenCalledWith( request );
			const link = await screen.findByRole( 'link', { name: 'Finish setting it up' } );
			expect( link ).toHaveAttribute( 'href', settings );
			expect( link ).toHaveFocus();
			expect( mockRecordEvent.mock.calls.map( ( [ name ] ) => name ) ).toEqual( [
				'jetpack_social_companion_plugin_notice_view',
				'jetpack_social_companion_plugin_notice_cta_click',
				'jetpack_social_companion_plugin_notice_activated',
			] );
			expect( speak ).toHaveBeenCalledWith( expect.stringMatching( / is active\.$/ ), 'polite' );
		}
	);

	it( 'sends Simple sites to WordPress.com to install the plugin', async () => {
		setup( { atmosphere: 'marketplace' } );
		// jsdom cannot navigate.
		const preventNavigation = ( event: Event ) => event.preventDefault();
		document.addEventListener( 'click', preventNavigation );

		const link = screen.getByRole( 'link', { name: 'Install ATmosphere' } );
		await userEvent.click( link );
		document.removeEventListener( 'click', preventNavigation );

		expect( link ).toHaveAttribute(
			'href',
			'https://wordpress.com/plugins/atmosphere/example.wordpress.com'
		);
		expect(
			screen.getByText( /To install ATmosphere, we’ll need to move your site over/ )
		).toBeInTheDocument();
		expect( mockedApiFetch ).not.toHaveBeenCalled();
		expect( mockRecordEvent ).toHaveBeenLastCalledWith(
			'jetpack_social_companion_plugin_notice_cta_click',
			expect.objectContaining( { plugin: 'atmosphere', action: 'marketplace' } )
		);
	} );

	it( 'treats a plugin that redirects on activation as active', async () => {
		mockedApiFetch
			.mockRejectedValueOnce( {
				code: 'invalid_json',
				message: 'The response is not a valid JSON response.',
			} )
			.mockResolvedValueOnce( { status: 'active' } );
		setup( { activitypub: 'activate' }, 'mastodon' );

		await userEvent.click( screen.getByRole( 'button', { name: 'Activate ActivityPub' } ) );

		await expect(
			screen.findByRole( 'link', { name: 'Finish setting it up' } )
		).resolves.toBeInTheDocument();
		expect( mockedApiFetch ).toHaveBeenLastCalledWith( {
			path: '/wp/v2/plugins/activitypub/activitypub',
		} );
	} );

	it( 'shows the error and keeps the button when the install fails', async () => {
		mockedApiFetch.mockRejectedValue( {
			message:
				'<p><strong>Error:</strong> Current PHP version does not meet requirements for ATmosphere&#8217;s update.</p>',
		} );
		setup( { atmosphere: 'install' } );

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
		mockScriptData( { social: { companion_plugins: { atmosphere: 'install' } } } );
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
