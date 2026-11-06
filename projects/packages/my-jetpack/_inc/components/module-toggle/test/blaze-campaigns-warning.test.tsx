import '@testing-library/jest-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { ModuleToggle } from '../index';
import type { MyJetpackModule } from '../../../types';
import type { RenderResult } from '@testing-library/react';

const mockToggleModule = jest.fn( () => Promise.resolve( true ) );

jest.mock( '@wordpress/api-fetch' );
jest.mock( '@automattic/jetpack-shared-stores', () => ( { store: {} } ) );
jest.mock( '@wordpress/notices', () => ( { store: 'core/notices' } ) );
jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => ( {
		updateJetpackModuleStatus: mockToggleModule,
		createSuccessNotice: jest.fn(),
		createErrorNotice: jest.fn(),
	} ),
	useSelect: callback => callback( () => ( { isModuleUpdating: () => false } ) ),
} ) );

const blaze = ( activated: boolean ) =>
	( { module: 'blaze', name: 'Blaze', available: true, activated } ) as MyJetpackModule;
const stats = {
	module: 'stats',
	name: 'Stats',
	available: true,
	activated: true,
} as MyJetpackModule;

const setScriptData = ( settingsConsolidation: boolean, suffix = 'example.com' ) => {
	window.JetpackScriptData = {
		site: { admin_url: 'https://example.com/wp-admin/', suffix },
		myJetpack: { settingsConsolidation },
	} as Window[ 'JetpackScriptData' ];
};

const findWarning = () =>
	screen.queryByRole( 'dialog', { name: 'Active Blaze campaigns are still running' } );

/**
 * Answer the campaigns check only when the test says so.
 *
 * @return Settles the check with the given status.
 */
const holdCampaignsCheck = () => {
	let answer: ( status: string ) => void = () => undefined;
	jest
		.mocked( apiFetch )
		.mockImplementation(
			() => new Promise( resolve => ( answer = status => resolve( { status } ) ) )
		);
	return ( status: string ) => act( async () => answer( status ) );
};

describe( 'ModuleToggle for Blaze', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		setScriptData( true );
	} );

	afterAll( () => {
		delete window.JetpackScriptData;
	} );

	it.each( [
		[ 'switches off without asking with the settings flag off', false, true, 'active', 0, false ],
		[ 'switches on without checking for campaigns', true, false, 'active', 0, false ],
		[ 'switches off without asking when no campaign runs', true, true, 'none', 1, false ],
		[ 'asks before switching off while campaigns run', true, true, 'active', 1, true ],
		[ 'asks before switching off when Blaze cannot tell', true, true, 'unknown', 1, true ],
		[ 'asks before switching off when the check fails', true, true, null, 1, true ],
	] )( '%s', async ( _label, flag, activated, status, checks, asks ) => {
		setScriptData( flag );
		jest
			.mocked( apiFetch )
			.mockImplementation( () =>
				status ? Promise.resolve( { status } ) : Promise.reject( new Error( 'offline' ) )
			);

		render( <ModuleToggle module={ blaze( activated ) } reloadAfterToggle={ false } /> );
		await userEvent.click( screen.getByRole( 'switch' ) );

		await waitFor( () =>
			expect( Boolean( findWarning() ) || mockToggleModule.mock.calls.length > 0 ).toBe( true )
		);
		expect( Boolean( findWarning() ) ).toBe( asks );
		expect( mockToggleModule.mock.calls ).toEqual(
			asks ? [] : [ [ { name: 'blaze', active: ! activated } ] ]
		);
		expect( apiFetch ).toHaveBeenCalledTimes( checks );
	} );

	it.each( [
		[ 'Disable anyway', 'button', [ [ { name: 'blaze', active: false } ] ], [ [ false ] ], 0 ],
		[ 'Keep Blaze enabled', 'button', [], [], 0 ],
		[ 'Close', 'button', [], [], 0 ],
		[ 'Manage campaigns', 'link', [], [], 1 ],
	] )(
		'closes the warning from %s, recording only what runs',
		async ( name, role, switches, switchEvents, manageClicks ) => {
			jest.mocked( apiFetch ).mockResolvedValue( { status: 'active' } );
			const onSwitch = jest.fn();
			const onManageClick = jest.fn();

			render(
				<ModuleToggle
					module={ blaze( true ) }
					reloadAfterToggle={ false }
					onSwitch={ onSwitch }
					onManageClick={ onManageClick }
				/>
			);
			await userEvent.click( screen.getByRole( 'switch' ) );

			const action = await screen.findByRole( role, { name: new RegExp( `^${ name }` ) } );
			// jsdom cannot navigate.
			action.addEventListener( 'click', event => event.preventDefault() );
			await userEvent.click( action );

			await waitFor( () => expect( findWarning() ).not.toBeInTheDocument() );
			await waitFor( () => expect( mockToggleModule.mock.calls ).toEqual( switches ) );
			expect( onSwitch.mock.calls ).toEqual( switchEvents );
			expect( onManageClick ).toHaveBeenCalledTimes( manageClicks );
		}
	);

	it.each( [
		[
			'the page Features opens for Blaze',
			'https://example.com/wp-admin/admin.php?page=wp-blaze',
			'https://example.com/wp-admin/admin.php?page=wp-blaze',
			'',
		],
		[
			'WordPress.com in a new tab without one',
			undefined,
			expect.stringContaining( 'source=jetpack-blaze' ),
			'_blank',
		],
	] )( 'sends Manage campaigns to %s', async ( _label, manageUrl, href, target ) => {
		jest.mocked( apiFetch ).mockResolvedValue( { status: 'active' } );

		render(
			<ModuleToggle module={ blaze( true ) } reloadAfterToggle={ false } manageUrl={ manageUrl } />
		);
		await userEvent.click( screen.getByRole( 'switch' ) );

		const link = await screen.findByRole( 'link', { name: /Manage campaigns/ } );
		expect( link ).toHaveAttribute( 'href', href );
		expect( link ).toHaveProperty( 'target', target );
	} );

	it( 'leaves Manage campaigns out with neither a page to open nor a site to name', async () => {
		setScriptData( true, '' );
		jest.mocked( apiFetch ).mockResolvedValue( { status: 'active' } );

		render( <ModuleToggle module={ blaze( true ) } reloadAfterToggle={ false } /> );
		await userEvent.click( screen.getByRole( 'switch' ) );
		await waitFor( () => expect( findWarning() ).toBeInTheDocument() );

		expect( screen.queryByRole( 'link', { name: /Manage campaigns/ } ) ).not.toBeInTheDocument();
	} );

	const moveToStats = ( view: RenderResult ) =>
		view.rerender( <ModuleToggle module={ stats } reloadAfterToggle={ false } /> );
	const unmount = ( view: RenderResult ) => view.unmount();

	it.each( [
		[ 'moves to another module', moveToStats, 'active' ],
		[ 'moves to another module', moveToStats, 'none' ],
		[ 'unmounts', unmount, 'active' ],
		[ 'unmounts', unmount, 'none' ],
	] )(
		'drops a check still out when the switch %s, answered %s',
		async ( _label, leave, status ) => {
			const answer = holdCampaignsCheck();
			const view = render( <ModuleToggle module={ blaze( true ) } reloadAfterToggle={ false } /> );
			await userEvent.click( screen.getByRole( 'switch' ) );

			leave( view );
			await answer( status );

			expect( findWarning() ).not.toBeInTheDocument();
			expect( mockToggleModule ).not.toHaveBeenCalled();

			// The hold went with it, so Blaze can be switched off again.
			render( <ModuleToggle module={ blaze( true ) } reloadAfterToggle={ false } /> );
			expect( screen.getByRole( 'switch', { name: 'Toggle Blaze module' } ) ).not.toHaveAttribute(
				'aria-disabled',
				'true'
			);
		}
	);

	it( 'runs one check and one warning for Blaze, however many switches show it', async () => {
		const answer = holdCampaignsCheck();
		render(
			<>
				<ModuleToggle module={ blaze( true ) } reloadAfterToggle={ false } />
				<ModuleToggle module={ blaze( true ) } reloadAfterToggle={ false } />
			</>
		);
		const [ card, modal ] = screen.getAllByRole( 'switch' );

		await userEvent.click( card );

		expect( modal ).toHaveAttribute( 'aria-disabled', 'true' );

		await answer( 'active' );

		await waitFor( () => expect( screen.getAllByRole( 'dialog' ) ).toHaveLength( 1 ) );
		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
	} );
} );
