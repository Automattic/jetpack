import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { SharingButtonsSection } from '../sections/sharing-buttons-section';
import {
	apiCalls,
	baseSettings,
	baseStatus,
	renderWithData,
	resetNotices,
	setScriptData,
} from './helpers';
import type { Services, Settings } from '../types';

jest.mock( '@wordpress/api-fetch' );
const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

type User = ReturnType< typeof userEvent.setup >;

const withResources: Settings = { ...baseSettings, disable_resources: false };

const services: Services = {
	visible: [ 'facebook', 'x' ],
	hidden: [ 'email' ],
	services: [
		{ id: 'facebook', name: 'Facebook', custom: false, deprecated: false },
		{ id: 'x', name: 'X', custom: false, deprecated: false },
		{ id: 'email', name: 'Email', custom: false, deprecated: false },
	],
};

/**
 * Answer the services route with the given list.
 *
 * @param list - Services.
 */
function servicesRespond( list: Services ) {
	mockApiFetch.mockImplementation( ( { path, method } ) => {
		if ( path?.endsWith( '/services' ) ) {
			return Promise.resolve( list );
		}
		return Promise.resolve( method === 'PUT' ? baseSettings : baseStatus );
	} );
}

beforeEach( () => {
	mockApiFetch.mockReset();
	resetNotices();
	setScriptData();
} );

afterEach( () => {
	delete ( window as unknown as { JetpackScriptData?: unknown } ).JetpackScriptData;
} );

describe( 'SharingButtonsSection', () => {
	it( 'lists the enabled services, the hidden ones apart, under the placement summary', async () => {
		servicesRespond( services );
		renderWithData( <SharingButtonsSection /> );

		await expect( screen.findByText( 'Facebook, X' ) ).resolves.toBeInTheDocument();
		expect(
			screen.getByRole( 'heading', { level: 2, name: 'Sharing buttons' } )
		).toBeInTheDocument();
		expect( screen.getByText( 'Behind the More button:' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Email' ) ).toBeInTheDocument();
		expect(
			screen.getByText( /Sharing buttons currently appear on: Posts, Pages\./ )
		).toBeInTheDocument();
	} );

	it( 'warns that an enabled service has shut down', async () => {
		servicesRespond( {
			...services,
			services: [
				...services.services.slice( 0, 2 ),
				{ id: 'email', name: 'Email', custom: false, deprecated: true },
			],
		} );
		renderWithData( <SharingButtonsSection /> );

		await expect(
			screen.findByText( /The Email sharing service has shut down/ )
		).resolves.toBeInTheDocument();
		expect( screen.queryByText( /The Facebook sharing service/ ) ).not.toBeInTheDocument();
	} );

	it( 'drops the placement summary when no service is enabled', async () => {
		servicesRespond( { visible: [], hidden: [], services: [] } );
		renderWithData( <SharingButtonsSection /> );

		await expect(
			screen.findByText( 'No sharing services are turned on.' )
		).resolves.toBeInTheDocument();
		expect( screen.queryByText( /currently appear on/ ) ).not.toBeInTheDocument();
	} );

	it.each( [
		[
			'the button style',
			( user: User ) => user.selectOptions( screen.getByLabelText( 'Button style' ), 'icon' ),
			{ button_style: 'icon' },
		],
		[
			'Disable CSS and JS',
			( user: User ) => user.click( screen.getByLabelText( 'Disable CSS and JS' ) ),
			{ disable_resources: true },
		],
	] )( 'saves %s as soon as it changes', async ( _name, interact, data ) => {
		const user = userEvent.setup();
		servicesRespond( services );
		renderWithData( <SharingButtonsSection />, { settings: withResources } );

		await interact( user );

		await waitFor( () =>
			expect( apiCalls( 'PUT' ) ).toEqual( [
				{ path: '/wpcom/v2/sharing-likes/settings', method: 'PUT', data },
			] )
		);
	} );

	it( 'shows no option the settings route did not offer', () => {
		servicesRespond( services );
		const rest = { ...withResources };
		delete rest.button_style;
		delete rest.sharing_label;
		delete rest.disable_resources;
		renderWithData( <SharingButtonsSection />, { settings: rest } );

		expect( screen.queryByLabelText( 'Button style' ) ).not.toBeInTheDocument();
		expect( screen.queryByLabelText( 'Sharing label' ) ).not.toBeInTheDocument();
		expect( screen.queryByLabelText( 'Disable CSS and JS' ) ).not.toBeInTheDocument();
	} );

	it( 'does not ask for services unless the section configures', () => {
		renderWithData( <SharingButtonsSection />, {
			status: { ...baseStatus, sharing: { state: 'off' } },
		} );

		expect( apiCalls() ).toEqual( [] );
	} );
} );
