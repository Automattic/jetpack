import { jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { SiteVerifyService } from '../site-verify-services';
import type { SiteVerifyBootstrap } from '../site-verify-types';

type Request = { path: string; method?: string };

const mockApiFetch = jest.fn< ( options: Request ) => Promise< unknown > >();
const saveCode = jest.fn< ( code: string ) => Promise< void > >();
const popup =
	jest.fn< ( url: string, callback: ( result: { keyring_id?: number } ) => void ) => void >();

jest.unstable_mockModule( '@wordpress/api-fetch', () => ( { default: mockApiFetch } ) );
jest.unstable_mockModule( '@automattic/request-external-access', () => ( {
	default: popup,
} ) );
let scriptData: Record< string, SiteVerifyBootstrap > = {};
jest.unstable_mockModule( '@automattic/jetpack-script-data', () => ( {
	getScriptData: () => ( { seo: scriptData } ),
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

const { useSiteVerify } = await import( '../use-site-verify' );
const { SITE_VERIFY_SERVICES } = await import( '../site-verify-services' );

describe.each( [
	{
		key: 'google',
		endpoint: '/jetpack/v4/verify-site/google',
		scriptDataKey: 'google_verify',
		toolsUrlField: 'google_search_console_url',
	},
	{
		key: 'bing',
		endpoint: '/jetpack/v4/verify-site/bing',
		scriptDataKey: 'bing_verify',
		toolsUrlField: 'webmaster_tools_url',
	},
] as const )( 'useSiteVerify ($key)', ( { key, endpoint, scriptDataKey, toolsUrlField } ) => {
	const service = SITE_VERIFY_SERVICES[ key ];
	let bootstrap: SiteVerifyBootstrap;
	const setBootstrap = ( next: SiteVerifyBootstrap ) => {
		bootstrap = next;
		scriptData = { [ scriptDataKey ]: next };
	};
	const VERIFY_POST = expect.objectContaining( { path: endpoint, method: 'POST' } );

	/**
	 * Answer the verify-site status reads, and acknowledge every POST.
	 *
	 * @param alreadyVerified - Whether the service already considers the site verified.
	 */
	function respond( alreadyVerified = false ) {
		mockApiFetch.mockImplementation( ( { path, method } ) =>
			Promise.resolve(
				method === 'POST'
					? {}
					: {
							verified: alreadyVerified && path.endsWith( '/7' ),
							is_owner: true,
							token: 'tok',
						}
			)
		);
	}

	/**
	 * Mount the hook and wait for its status read.
	 *
	 * @param forService - The service to verify with.
	 * @return The rendered hook.
	 */
	async function mountHook( forService: SiteVerifyService = service ) {
		const view = renderHook( () => useSiteVerify( forService, { saveCode } ) );
		await waitFor( () => expect( view.result.current.state ).not.toBe( 'loading' ) );
		return view;
	}

	beforeEach( () => {
		jest.clearAllMocks();
		setBootstrap( { connect_url: 'https://example.com/connect', is_connected: true } );
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

	it( 'asks the service to verify only once the code is saved', async () => {
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

	it( "links to the service's own dashboard from its status field", async () => {
		mockApiFetch.mockResolvedValue( {
			verified: true,
			is_owner: true,
			google_search_console_url: 'https://example.com/google_search_console_url',
			webmaster_tools_url: 'https://example.com/webmaster_tools_url',
		} );
		const { result } = await mountHook();

		expect( result.current.toolsUrl ).toBe( `https://example.com/${ toolsUrlField }` );
	} );

	it( 'uses a native host transport without a Jetpack user connection', async () => {
		const apiPath = `/wpcom/v2/seo/${ key }-verify`;
		setBootstrap( {
			connect_url: 'https://example.com/native-connect',
			is_connected: false,
			can_auto_verify: true,
			api_path: apiPath,
		} );
		respond();
		const { result } = await mountHook();
		expect( result.current.canAutoVerify ).toBe( true );
		act( () => result.current.autoVerify() );
		await waitFor( () => expect( result.current.isVerifying ).toBe( false ) );
		expect(
			mockApiFetch.mock.calls.map( ( [ request ] ) => [ request.path, request.method ?? 'GET' ] )
		).toEqual( [
			[ apiPath, 'GET' ],
			[ `${ apiPath }/7`, 'GET' ],
			[ apiPath, 'POST' ],
			[ `${ apiPath }/7`, 'GET' ],
		] );
		expect( saveCode ).toHaveBeenCalledWith( 'tok' );
		expect( popup ).toHaveBeenCalledWith( bootstrap.connect_url, expect.any( Function ) );
	} );

	it.each( [
		[ 'disconnected user', { is_connected: false } ],
		[ 'missing popup URL', { connect_url: '' } ],
		[ 'host disables automatic verification', { can_auto_verify: false } ],
	] )( 'keeps manual entry for %s', async ( _label, overrides ) => {
		setBootstrap( { ...bootstrap, ...overrides } );
		const { result } = await mountHook();
		expect( result.current.canAutoVerify ).toBe( false );
		expect( result.current.state ).toBe( 'unavailable' );
		act( () => result.current.autoVerify() );
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );

	it( "ignores another service's bootstrap", async () => {
		const other = Object.values( SITE_VERIFY_SERVICES ).find( s => s.key !== key );
		const { result } = await mountHook( other );
		expect( result.current.state ).toBe( 'unavailable' );
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
