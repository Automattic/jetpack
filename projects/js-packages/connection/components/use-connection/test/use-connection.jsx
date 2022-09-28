import restApi from '@automattic/jetpack-api';
import { jest } from '@jest/globals';
import { renderHook } from '@testing-library/react-hooks';
import { useSelect, useDispatch } from '@wordpress/data';
import useConnection from '../';
import { STORE_ID } from '../../../state/store';

let spySetApiRoot;
let spySetApiNonce;

let stubConnectUser;
let stubRegisterSite;
let stubGetSiteIsRegistering;
let stubGetUserIsConnecting;
let stubGetConnectionStatus;

describe( 'useConnection', () => {
	const setupStubs = () => {
		const { result: dispatch } = renderHook( () => useDispatch( STORE_ID ) );
		let storeSelect;
		renderHook( () => useSelect( select => ( storeSelect = select( STORE_ID ) ) ) );

		// stubs
		stubRegisterSite = jest
			.spyOn( dispatch.current, 'registerSite' )
			.mockReset()
			.mockResolvedValue();
		stubConnectUser = jest.spyOn( dispatch.current, 'connectUser' ).mockReset().mockReturnValue();
		stubGetSiteIsRegistering = jest
			.spyOn( storeSelect, 'getSiteIsRegistering' )
			.mockReset()
			.mockReturnValue( false );
		stubGetUserIsConnecting = jest
			.spyOn( storeSelect, 'getUserIsConnecting' )
			.mockReset()
			.mockReturnValue( false );
		stubGetConnectionStatus = jest
			.spyOn( storeSelect, 'getConnectionStatus' )
			.mockReset()
			.mockReturnValue( {} );

		// spies
		spySetApiRoot = jest.spyOn( restApi, 'setApiRoot' );
		spySetApiNonce = jest.spyOn( restApi, 'setApiNonce' );
	};

	it( 'set api root and nonce on start', () => {
		setupStubs();
		const initialProps = { apiRoot: 'API_ROOT', apiNonce: 'API_NONCE' };
		const { result } = renderHook( props => useConnection( props ), { initialProps } );
		result.current.handleRegisterSite();
		expect( spySetApiRoot ).toHaveBeenCalledTimes( 1 );
		expect( spySetApiNonce ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'calls registerSite automatically', () => {
		setupStubs();
		const initialProps = {
			autoTrigger: true,
			registrationNonce: 'REGISTRATION',
			redirectUri: 'REDIRECT',
		};
		const { rerender } = renderHook( props => useConnection( props ), { initialProps } );
		expect( stubRegisterSite ).toHaveBeenCalledTimes( 1 );
		expect( stubRegisterSite ).toHaveBeenCalledWith( {
			registrationNonce: 'REGISTRATION',
			redirectUri: 'REDIRECT',
		} );
		stubRegisterSite.mockClear();
		rerender( { autoTrigger: false } );
		expect( stubRegisterSite ).not.toHaveBeenCalled();
	} );

	it( "doesn't call registerSite if site is registering", () => {
		setupStubs();
		stubGetSiteIsRegistering.mockReturnValue( true );
		const initialProps = { autoTrigger: true };
		renderHook( props => useConnection( props ), { initialProps } );
		expect( stubRegisterSite ).not.toHaveBeenCalled();
	} );

	it( "doesn't call registerSite if user is connecting", () => {
		setupStubs();
		stubGetUserIsConnecting.mockReturnValue( true );
		const initialProps = { autoTrigger: true };
		renderHook( props => useConnection( props ), { initialProps } );
		expect( stubRegisterSite ).not.toHaveBeenCalled();
	} );

	// eslint-disable-next-line jest/no-done-callback
	it( 'calls connectUser after register site', done => {
		setupStubs();
		const initialProps = {
			registrationNonce: 'REGISTRATION',
			redirectUri: 'REDIRECT',
			from: 'JETPACK',
		};
		const { result } = renderHook( props => useConnection( props ), { initialProps } );

		result.current.handleRegisterSite();

		setTimeout( () => {
			expect( stubConnectUser ).toHaveBeenCalledTimes( 1 );
			expect( stubConnectUser ).toHaveBeenCalledWith( {
				from: 'JETPACK',
				redirectUri: 'REDIRECT',
			} );
			done();
		}, 100 );
	} );

	it( 'calls only connectUser if site is registered', () => {
		setupStubs();
		stubGetConnectionStatus.mockReturnValue( { isRegistered: true } );
		const { result } = renderHook( props => useConnection( props ), {
			initialProps: { from: 'JETPACK' },
		} );
		result.current.handleRegisterSite();
		expect( stubRegisterSite ).not.toHaveBeenCalled();
		expect( stubConnectUser ).toHaveBeenCalledTimes( 1 );
		expect( stubConnectUser ).toHaveBeenCalledWith( { from: 'JETPACK', redirectUri: undefined } );
	} );
} );
