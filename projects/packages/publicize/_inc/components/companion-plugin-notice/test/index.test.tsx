import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { CompanionPluginNotice } from '..';
import { clearMockedScriptData, mockScriptData } from '../../../utils/test-utils';
import { resetCompanionPluginStates } from '../use-companion-plugin';
import type { CompanionPlugin } from '../../../types';

jest.mock( '@wordpress/api-fetch' );

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
	is_installed: false,
	settings_url: 'https://example.com/wp-admin/options-general.php?page=atmosphere',
	...overrides,
} );

const setup = ( plugins: CompanionPlugin[] ) => {
	mockScriptData( { social: { companion_plugins: plugins } } );
	return render( <CompanionPluginNotice serviceName="bluesky" context="admin-page" /> );
};

describe( 'CompanionPluginNotice', () => {
	beforeEach( () => {
		mockedApiFetch.mockReset();
		mockRecordEvent.mockReset();
	} );

	afterEach( () => {
		clearMockedScriptData();
		resetCompanionPluginStates();
	} );

	it( 'renders nothing when no plugin is offered for the network', () => {
		const { container } = setup( [] );

		expect( container ).toBeEmptyDOMElement();
		expect( mockRecordEvent ).not.toHaveBeenCalled();
	} );

	it.each( [
		{
			is_installed: false,
			button: 'Install ATmosphere',
			request: {
				path: '/wp/v2/plugins',
				method: 'POST',
				data: { slug: 'atmosphere', status: 'active' },
			},
		},
		{
			is_installed: true,
			button: 'Activate ATmosphere',
			request: {
				path: '/wp/v2/plugins/atmosphere/atmosphere',
				method: 'PUT',
				data: { status: 'active' },
			},
		},
	] )(
		'$button sends the matching core request and links to the settings',
		async ( { is_installed, button, request } ) => {
			mockedApiFetch.mockResolvedValue( {} );
			setup( [ atmosphere( { is_installed } ) ] );

			await userEvent.click( screen.getByRole( 'button', { name: button } ) );

			expect( mockedApiFetch ).toHaveBeenCalledWith( request );
			await expect(
				screen.findByRole( 'link', { name: 'Finish setting it up' } )
			).resolves.toHaveAttribute( 'href', atmosphere().settings_url );
			expect( mockRecordEvent.mock.calls.map( ( [ name ] ) => name ) ).toEqual( [
				'jetpack_social_companion_plugin_notice_view',
				'jetpack_social_companion_plugin_notice_cta_click',
				'jetpack_social_companion_plugin_notice_activated',
			] );
		}
	);

	it( 'shows the error and keeps the button when the install fails', async () => {
		mockedApiFetch.mockRejectedValue( { message: 'Could not create directory.' } );
		setup( [ atmosphere() ] );

		await userEvent.click( screen.getByRole( 'button', { name: 'Install ATmosphere' } ) );

		await expect(
			screen.findByText( 'ATmosphere could not be set up: Could not create directory.' )
		).resolves.toBeInTheDocument();
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
