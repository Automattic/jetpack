import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { select } from '@wordpress/data';
import { resetLocaleData, setLocaleData } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { ServicesManager } from '../services/services-manager';
import {
	apiCalls,
	baseSettings,
	baseStatus,
	renderWithData,
	resetNotices,
	setScriptData,
} from './helpers';
import type { Services, Settings, Status } from '../types';

jest.mock( '@wordpress/api-fetch' );
const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

const services: Services = {
	visible: [ 'facebook', 'x' ],
	hidden: [ 'email' ],
	services: [
		{ id: 'facebook', name: 'Facebook', custom: false, deprecated: false },
		{ id: 'x', name: 'X', custom: false, deprecated: false },
		{ id: 'email', name: 'Email', custom: false, deprecated: false },
		{ id: 'mastodon', name: 'Mastodon', custom: false, deprecated: false },
		{ id: 'acme', name: 'Acme', custom: false, deprecated: false },
	],
};

/**
 * Answer the services routes with the given list, and echo saved lists back.
 *
 * @param list - Services.
 */
function respond( list: Services = services ) {
	mockApiFetch.mockImplementation( ( { path, method, data } ) => {
		if ( path?.endsWith( '/services/custom' ) ) {
			return Promise.resolve( {
				id: 'custom-1',
				custom: true,
				deprecated: false,
				...( data as object ),
			} );
		}
		if ( path?.endsWith( '/services' ) ) {
			return Promise.resolve( method === 'PUT' ? { ...list, ...( data as object ) } : list );
		}
		return Promise.resolve( path?.endsWith( '/settings' ) ? baseSettings : baseStatus );
	} );
}

/**
 * Render the manager once its services have loaded.
 *
 * @param data          - Cache contents.
 * @param data.status   - Status.
 * @param data.settings - Settings.
 * @return Render result.
 */
async function renderManager( data: { status?: Status; settings?: Settings } = {} ) {
	const view = renderWithData( <ServicesManager />, data );
	await expect(
		screen.findByRole( 'group', { name: 'Shown as buttons' } )
	).resolves.toBeInTheDocument();
	return view;
}

/**
 * Names of the service buttons in a row, in order.
 *
 * @param row - Row label.
 * @return Names.
 */
function rowNames( row: string ): string[] {
	return within( screen.getByRole( 'group', { name: row } ) )
		.getAllByRole( 'button' )
		.map( button => button.getAttribute( 'aria-label' ) ?? button.textContent ?? '' )
		.filter( name => ! name.startsWith( 'Add' ) );
}

/**
 * Select a service's button, then click one of its toolbar's buttons.
 *
 * @param user    - User event instance.
 * @param service - Service name.
 * @param action  - Toolbar button label.
 */
async function runToolbarAction(
	user: ReturnType< typeof userEvent.setup >,
	service: string,
	action: string
) {
	await user.click( screen.getByRole( 'button', { name: service } ) );
	const toolbar = await screen.findByRole( 'toolbar', { name: `${ service } options` } );
	await user.click( within( toolbar ).getByRole( 'button', { name: action } ) );
}

beforeEach( () => {
	mockApiFetch.mockReset();
	resetNotices();
	setScriptData();
	respond();
} );

afterEach( () => {
	resetLocaleData();
	delete ( window as unknown as { JetpackScriptData?: unknown } ).JetpackScriptData;
} );

describe( 'ServicesManager', () => {
	it.each( [ 'icon-text', 'icon', 'text' ] as const )(
		'shows each row in order, with the %s button style',
		async buttonStyle => {
			await renderManager( { settings: { ...baseSettings, button_style: buttonStyle } } );

			expect( rowNames( 'Shown as buttons' ) ).toEqual( [ 'Facebook', 'X' ] );
			expect( rowNames( 'Behind the More button' ) ).toEqual( [ 'Email' ] );
		}
	);

	it( 'moves a selected button and saves the new order', async () => {
		const user = userEvent.setup();
		await renderManager();

		await runToolbarAction( user, 'X', 'Move left' );

		await waitFor( () =>
			expect( apiCalls( 'PUT' ) ).toEqual( [
				{
					path: '/wpcom/v2/sharing-likes/services',
					method: 'PUT',
					data: { visible: [ 'x', 'facebook' ], hidden: [ 'email' ] },
				},
			] )
		);
	} );

	it( 'moves left visually in a right-to-left language', async () => {
		setLocaleData( { 'text direction\u0004ltr': [ 'rtl' ] } );
		const user = userEvent.setup();
		await renderManager();

		await runToolbarAction( user, 'Facebook', 'Move left' );

		await waitFor( () =>
			expect( apiCalls( 'PUT' )[ 0 ] ).toMatchObject( { data: { visible: [ 'x', 'facebook' ] } } )
		);
	} );

	it( 'removes a button, with an Undo that puts it back', async () => {
		const user = userEvent.setup();
		await renderManager();

		await runToolbarAction( user, 'X', 'Remove' );
		await waitFor( () => expect( apiCalls( 'PUT' ) ).toHaveLength( 1 ) );
		const notice = select( noticesStore )
			.getNotices()
			.find( ( { content } ) => content === 'X removed.' );
		await act( async () => notice?.actions?.[ 0 ]?.onClick?.() );

		await waitFor( () =>
			expect( apiCalls( 'PUT' ).map( call => call.data ) ).toEqual( [
				{ visible: [ 'facebook' ], hidden: [ 'email' ] },
				{ visible: [ 'facebook', 'x' ], hidden: [ 'email' ] },
			] )
		);
	} );

	it( 'asks before removing the last button on a block theme, and saves nothing on Cancel', async () => {
		respond( { ...services, visible: [ 'x' ], hidden: [] } );
		const user = userEvent.setup();
		await renderManager( {
			status: { ...baseStatus, sharing: { state: 'configure_with_block_nudge' } },
		} );

		await runToolbarAction( user, 'X', 'Remove' );
		const dialog = await screen.findByRole( 'alertdialog' );
		await user.click( within( dialog ).getByRole( 'button', { name: 'Cancel' } ) );

		expect( apiCalls( 'PUT' ) ).toEqual( [] );
	} );

	it( 'notes the restriction on a private site', async () => {
		setScriptData( { private_site: true } );
		await renderManager();

		expect(
			screen.getByText(
				'Please note that your services have been restricted because your site is private.',
				// The notice also announces itself through the a11y-speak live region.
				{ ignore: 'script, style, .a11y-speak-region' }
			)
		).toBeInTheDocument();
	} );
	it.each( [
		[ 'Add sharing buttons', { visible: [ 'facebook', 'x', 'mastodon' ], hidden: [ 'email' ] } ],
		[ 'Add to the More button', { visible: [ 'facebook', 'x' ], hidden: [ 'email', 'mastodon' ] } ],
	] )( '"%s" adds a service at the end of its row', async ( label, data ) => {
		const user = userEvent.setup();
		await renderManager();

		await user.click( screen.getByRole( 'button', { name: label } ) );
		await user.click(
			within( await screen.findByRole( 'dialog' ) ).getByRole( 'button', { name: 'Mastodon' } )
		);

		await waitFor( () =>
			expect( apiCalls( 'PUT' ) ).toEqual( [
				{ path: '/wpcom/v2/sharing-likes/services', method: 'PUT', data },
			] )
		);
	} );

	it( 'offers only services the site does not use, and none that shut down', async () => {
		respond( {
			...services,
			services: [
				...services.services,
				{ id: 'pocket', name: 'Pocket', custom: false, deprecated: true },
			],
		} );
		const user = userEvent.setup();
		await renderManager();

		await user.click( screen.getByRole( 'button', { name: 'Add sharing buttons' } ) );
		const dialog = await screen.findByRole( 'dialog' );

		expect( within( dialog ).getByRole( 'button', { name: 'Mastodon' } ) ).toBeInTheDocument();
		expect( within( dialog ).getByRole( 'button', { name: 'Acme' } ) ).toBeInTheDocument();
		expect(
			within( dialog ).queryByRole( 'button', { name: 'Facebook' } )
		).not.toBeInTheDocument();
		expect( within( dialog ).queryByRole( 'button', { name: 'Pocket' } ) ).not.toBeInTheDocument();
	} );

	it( 'creates a custom service once every field is filled in', async () => {
		const user = userEvent.setup();
		await renderManager();

		await user.click( screen.getByRole( 'button', { name: 'Add sharing buttons' } ) );
		await user.click(
			within( await screen.findByRole( 'dialog' ) ).getByRole( 'button', {
				name: 'Custom service',
			} )
		);
		await user.type( screen.getByLabelText( 'Service name' ), 'Lobsters' );
		await user.type( screen.getByLabelText( 'Sharing URL' ), 'https://l.example/?u=%post_url%' );
		expect( screen.getByRole( 'button', { name: 'Create and add' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		await user.type( screen.getByLabelText( 'Icon URL' ), 'https://l.example/i.png' );
		await user.click( screen.getByRole( 'button', { name: 'Create and add' } ) );

		await waitFor( () =>
			expect( apiCalls( 'POST' ) ).toEqual( [
				{
					path: '/wpcom/v2/sharing-likes/services/custom',
					method: 'POST',
					data: {
						name: 'Lobsters',
						url: 'https://l.example/?u=%post_url%',
						icon: 'https://l.example/i.png',
					},
				},
			] )
		);
	} );
} );
