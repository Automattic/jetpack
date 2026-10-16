import { act, renderHook, waitFor } from '@testing-library/react';
import { onSwitchWritten } from '../../../../data/switch-written';
import { useSidebarSync } from '../use-sidebar-sync';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getAdminUrl: ( path: string ) => `https://example.com/wp-admin/${ path }`,
} ) );
jest.mock( '../../../../data/switch-written', () => ( { onSwitchWritten: jest.fn() } ) );

const feature = ( slug: string ) =>
	( {
		slug,
		name: slug.toUpperCase(),
		manage_url: `https://example.com/wp-admin/admin.php?page=${ slug }`,
	} ) as MainFeature;

const page = ( ...pages: string[] ) =>
	`<ul id="adminmenu"><li id="toplevel_page_jetpack"><a href="admin.php?page=my-jetpack">Jetpack</a><ul class="wp-submenu">${ pages
		.map( slug => `<li><a href="admin.php?page=${ slug }">${ slug }</a></li>` )
		.join( '' ) }</ul></li></ul>`;

const respond = ( html: string ) => Promise.resolve( { ok: true, text: async () => html } );

describe( 'useSidebarSync', () => {
	let fetchMock: jest.Mock;
	let switchWritten: () => void;

	beforeEach( () => {
		document.body.innerHTML = page( 'my-jetpack' );
		fetchMock = jest.fn();
		global.fetch = fetchMock;
		jest.mocked( onSwitchWritten ).mockImplementation( listener => {
			switchWritten = listener;
			return () => {};
		} );
	} );

	it( 'does not fetch the menu until a switch is written', () => {
		renderHook( () => useSidebarSync( [ feature( 'stats' ) ] ) );

		expect( fetchMock ).not.toHaveBeenCalled();
	} );

	it( 'adds the new menu item and points at it once a switch is written', async () => {
		fetchMock.mockReturnValue( respond( page( 'my-jetpack', 'stats' ) ) );

		const { result } = renderHook( () => useSidebarSync( [ feature( 'stats' ) ] ) );

		act( () => switchWritten() );

		await waitFor( () => expect( result.current.pointer ).not.toBeNull() );

		expect( fetchMock ).toHaveBeenCalledWith(
			'https://example.com/wp-admin/tools.php',
			expect.objectContaining( {
				credentials: 'same-origin',
				headers: { Accept: 'application/json' },
			} )
		);
		expect( result.current.pointer?.label ).toBe( 'STATS is now in your menu' );
		expect( result.current.pointer?.elements.map( item => item.textContent ) ).toEqual( [
			'stats',
		] );
	} );

	it( 'points at every item a refresh added', async () => {
		fetchMock.mockReturnValue( respond( page( 'my-jetpack', 'stats', 'blaze' ) ) );

		const { result } = renderHook( () => useSidebarSync( [ feature( 'stats' ) ] ) );

		act( () => switchWritten() );

		await waitFor( () => expect( result.current.pointer ).not.toBeNull() );

		expect( result.current.pointer?.label ).toBe( '2 features are now in your menu' );
		expect( result.current.pointer?.elements.map( item => item.textContent ) ).toEqual( [
			'stats',
			'blaze',
		] );
	} );

	it( 'retires the pointer when a later refresh only takes items away', async () => {
		fetchMock
			.mockReturnValueOnce( respond( page( 'my-jetpack', 'stats' ) ) )
			.mockReturnValueOnce( respond( page( 'my-jetpack' ) ) );

		const { result } = renderHook( () => useSidebarSync( [ feature( 'stats' ) ] ) );

		act( () => switchWritten() );
		await waitFor( () => expect( result.current.pointer ).not.toBeNull() );

		act( () => switchWritten() );
		await waitFor( () => expect( result.current.pointer ).toBeNull() );
	} );

	it( 'aborts a refresh a newer write supersedes', async () => {
		fetchMock
			// Rejects on abort, as fetch does, so the queue hold it took is released.
			.mockImplementationOnce(
				( _url: string, { signal }: RequestInit ) =>
					new Promise( ( _resolve, reject ) =>
						signal?.addEventListener( 'abort', () => reject( new Error( 'aborted' ) ) )
					)
			)
			.mockReturnValueOnce( respond( page( 'my-jetpack', 'stats' ) ) );

		const { result } = renderHook( () => useSidebarSync( [ feature( 'stats' ) ] ) );

		act( () => switchWritten() );
		act( () => switchWritten() );

		await waitFor( () => expect( result.current.pointer ).not.toBeNull() );

		expect( fetchMock.mock.calls[ 0 ][ 1 ].signal.aborted ).toBe( true );
		expect( fetchMock.mock.calls[ 1 ][ 1 ].signal.aborted ).toBe( false );
	} );

	it( 'retries a failed refresh once', async () => {
		fetchMock
			.mockReturnValueOnce( Promise.reject( new Error( 'offline' ) ) )
			.mockReturnValueOnce( respond( page( 'my-jetpack', 'stats' ) ) );

		const { result } = renderHook( () => useSidebarSync( [ feature( 'stats' ) ] ) );

		act( () => switchWritten() );

		await waitFor( () => expect( result.current.pointer ).not.toBeNull() );

		expect( fetchMock ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'gives up after one retry', async () => {
		fetchMock.mockImplementation( () => Promise.reject( new Error( 'offline' ) ) );

		renderHook( () => useSidebarSync( [ feature( 'stats' ) ] ) );

		act( () => switchWritten() );

		await waitFor( () => expect( fetchMock ).toHaveBeenCalledTimes( 2 ) );
		await act( () => new Promise( resolve => setTimeout( resolve, 20 ) ) );

		expect( fetchMock ).toHaveBeenCalledTimes( 2 );
	} );
} );
