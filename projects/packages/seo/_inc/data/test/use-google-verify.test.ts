import { jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { GoogleVerifyBootstrap } from '../google-verify-types';

type Request = { path: string; method?: string };

const mockApiFetch = jest.fn< ( options: Request ) => Promise< unknown > >();
const saveCode = jest.fn< ( code: string ) => Promise< void > >();
const popup =
	jest.fn< ( url: string, callback: ( result: { keyring_id?: number } ) => void ) => void >();

jest.unstable_mockModule( '@wordpress/api-fetch', () => ( { default: mockApiFetch } ) );
jest.unstable_mockModule( '@automattic/request-external-access', () => ( {
	default: popup,
} ) );
let bootstrap: GoogleVerifyBootstrap;
jest.unstable_mockModule( '@automattic/jetpack-script-data', () => ( {
	getScriptData: () => ( { seo: { google_verify: bootstrap } } ),
} ) );
jest.unstable_mockModule( '@wordpress/notices', () => ( { store: 'core/notices' } ) );
const createErrorNotice = jest.fn();

jest.unstable_mockModule( '@wordpress/data', () => ( {
	useDispatch: () => ( {
		createInfoNotice: jest.fn(),
		createSuccessNotice: jest.fn(),
		createErrorNotice,
	} ),
} ) );

const { useGoogleVerify } = await import( '../use-google-verify' );

const VERIFY_POST = expect.objectContaining( {
	path: '/jetpack/v4/verify-site/google',
	method: 'POST',
} );

/**
 * Answer the verify-site status reads, and acknowledge every POST.
 *
 * @param alreadyVerified - Whether Google already considers the site verified.
 */
function respond( alreadyVerified = false ) {
	mockApiFetch.mockImplementation( ( { path, method } ) =>
		Promise.resolve(
			method === 'POST'
				? {}
				: {
						verified: alreadyVerified && path.endsWith( '/7' ),
						is_owner: true,
						google_search_console_url: '',
						token: 'tok',
					}
		)
	);
}

/**
 * Mount the hook and wait for its status read.
 *
 * @return The rendered hook.
 */
async function mountHook() {
	const view = renderHook( () => useGoogleVerify( { saveCode } ) );
	await waitFor( () => expect( view.result.current.state ).not.toBe( 'loading' ) );
	return view;
}

describe( 'useGoogleVerify', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		bootstrap = { connect_url: 'https://example.com/connect', is_connected: true };
		popup.mockImplementation( ( _url, callback ) => callback( { keyring_id: 7 } ) );
		saveCode.mockResolvedValue( undefined );
	} );

	it.each( [
		[ 'saves the token through the settings form', false, [ [ 'tok' ] ] ],
		[ 'saves nothing when the site is already verified', true, [] ],
	] )( '%s', async ( _label, alreadyVerified, calls ) => {
		respond( alreadyVerified );
		const { result } = await mountHook();

		act( () => result.current.autoVerify() );
		await waitFor( () => expect( result.current.isVerifying ).toBe( false ) );
		expect( saveCode.mock.calls ).toEqual( calls );
		expect( mockApiFetch ).not.toHaveBeenCalledWith(
			expect.objectContaining( { path: '/wp/v2/settings' } )
		);
	} );

	it( 'asks Google to verify only once the code is saved', async () => {
		let finishSave: () => void = () => undefined;
		saveCode.mockImplementation(
			() =>
				new Promise< void >( resolve => {
					finishSave = resolve;
				} )
		);
		respond();
		const { result } = await mountHook();

		act( () => result.current.autoVerify() );
		await waitFor( () => expect( saveCode ).toHaveBeenCalled() );
		expect( mockApiFetch ).not.toHaveBeenCalledWith( VERIFY_POST );
		expect( result.current.isConfirming ).toBe( true );

		await act( async () => finishSave() );

		await waitFor( () => expect( result.current.isVerifying ).toBe( false ) );
		expect( mockApiFetch ).toHaveBeenCalledWith( VERIFY_POST );
		expect( result.current.isConfirming ).toBe( false );
	} );

	it( 'stops with an error when the code save fails', async () => {
		saveCode.mockRejectedValue( { message: 'Nope.' } );
		respond();
		const { result } = await mountHook();

		act( () => result.current.autoVerify() );
		await waitFor( () => expect( result.current.isVerifying ).toBe( false ) );
		expect( mockApiFetch ).not.toHaveBeenCalledWith( VERIFY_POST );
		expect( createErrorNotice ).toHaveBeenCalledWith( 'Nope.', expect.anything() );
	} );
	it( 'uses a native host transport without a Jetpack user connection', async () => {
		bootstrap = {
			connect_url: 'https://example.com/native-connect',
			is_connected: false,
			can_auto_verify: true,
			api_path: '/wpcom/v2/seo/google-verify',
		};
		respond();
		const { result } = await mountHook();
		expect( result.current.canAutoVerify ).toBe( true );
		act( () => result.current.autoVerify() );
		await waitFor( () => expect( result.current.isVerifying ).toBe( false ) );
		expect(
			mockApiFetch.mock.calls.map( ( [ request ] ) => [ request.path, request.method ?? 'GET' ] )
		).toEqual( [
			[ '/wpcom/v2/seo/google-verify', 'GET' ],
			[ '/wpcom/v2/seo/google-verify/7', 'GET' ],
			[ '/wpcom/v2/seo/google-verify', 'POST' ],
			[ '/wpcom/v2/seo/google-verify/7', 'GET' ],
		] );
		expect( saveCode ).toHaveBeenCalledWith( 'tok' );
		expect( popup ).toHaveBeenCalledWith( bootstrap.connect_url, expect.any( Function ) );
	} );

	it.each( [
		[ 'disconnected user', { is_connected: false } ],
		[ 'missing popup URL', { connect_url: '' } ],
		[ 'host disables automatic verification', { can_auto_verify: false } ],
	] )( 'keeps manual entry for %s', async ( _label, overrides ) => {
		bootstrap = { ...bootstrap, ...overrides };
		const { result } = await mountHook();
		expect( result.current.canAutoVerify ).toBe( false );
		expect( result.current.state ).toBe( 'unavailable' );
		act( () => result.current.autoVerify() );
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );

	it.each( [ 'forbidden', 'rest_forbidden', 'rest_no_route' ] )(
		'keeps manual entry after %s',
		async code => {
			mockApiFetch.mockRejectedValue( { code } );
			const { result } = await mountHook();
			expect( result.current.state ).toBe( 'unavailable' );
			act( () => result.current.autoVerify() );
			expect( mockApiFetch ).toHaveBeenCalledTimes( 1 );
			expect( saveCode ).not.toHaveBeenCalled();
			expect( popup ).not.toHaveBeenCalled();
		}
	);

	it( 'allows another attempt after the connection popup is canceled', async () => {
		popup.mockImplementation( ( _url, callback ) => callback( {} ) );
		respond();
		const { result } = await mountHook();
		act( () => result.current.autoVerify() );
		expect( result.current.isVerifying ).toBe( false );
		expect( result.current.isConfirming ).toBe( false );
		expect( saveCode ).not.toHaveBeenCalled();
		popup.mockImplementation( ( _url, callback ) => callback( { keyring_id: 7 } ) );
		act( () => result.current.autoVerify() );
		await waitFor( () => expect( result.current.isVerifying ).toBe( false ) );
		expect( saveCode ).toHaveBeenCalledWith( 'tok' );
	} );
} );
