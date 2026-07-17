import restApi from '@automattic/jetpack-api';
import { jest } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import { useSelect, useDispatch } from '@wordpress/data';
import useConnection from '../';
import { STORE_ID } from '../../../state/store';
import type { UseConnectionProps } from '../types';

/**
 * The slice of store dispatch this test spies on. The store is authored in
 * untyped JS, so we declare the shape we exercise here.
 */
interface StoreDispatch {
	registerSite: () => Promise< void >;
	connectUser: () => void;
}

/**
 * The slice of store selectors this test spies on.
 */
interface StoreSelect {
	getSiteIsRegistering: () => boolean;
	getUserIsConnecting: () => boolean;
	getConnectionStatus: () => Record< string, unknown >;
}

describe( 'useConnection', () => {
	const setupStubs = () => {
		const { result: dispatch } = renderHook( () => useDispatch( STORE_ID ) as StoreDispatch );
		let storeSelect: StoreSelect;
		renderHook( () => useSelect( select => ( storeSelect = select( STORE_ID ) as StoreSelect ) ) );

		// stubs
		const stubRegisterSite = jest
			.spyOn( dispatch.current, 'registerSite' )
			.mockReset()
			.mockResolvedValue();
		const stubConnectUser = jest
			.spyOn( dispatch.current, 'connectUser' )
			.mockReset()
			.mockReturnValue();
		const stubGetSiteIsRegistering = jest
			.spyOn( storeSelect, 'getSiteIsRegistering' )
			.mockReset()
			.mockReturnValue( false );
		const stubGetUserIsConnecting = jest
			.spyOn( storeSelect, 'getUserIsConnecting' )
			.mockReset()
			.mockReturnValue( false );
		const stubGetConnectionStatus = jest
			.spyOn( storeSelect, 'getConnectionStatus' )
			.mockReset()
			.mockReturnValue( {} );

		// spies
		const spySetApiRoot = jest.spyOn( restApi, 'setApiRoot' );
		const spySetApiNonce = jest.spyOn( restApi, 'setApiNonce' );

		return {
			stubRegisterSite,
			stubConnectUser,
			stubGetSiteIsRegistering,
			stubGetUserIsConnecting,
			stubGetConnectionStatus,
			spySetApiRoot,
			spySetApiNonce,
		};
	};

	it( 'set api root and nonce on start', () => {
		const { spySetApiRoot, spySetApiNonce } = setupStubs();
		const initialProps = { apiRoot: 'API_ROOT', apiNonce: 'API_NONCE' };
		const { result } = renderHook( ( props: UseConnectionProps ) => useConnection( props ), {
			initialProps,
		} );
		result.current.handleRegisterSite();
		expect( spySetApiRoot ).toHaveBeenCalledTimes( 1 );
		expect( spySetApiNonce ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'calls registerSite automatically', () => {
		const { stubRegisterSite } = setupStubs();
		const initialProps = {
			autoTrigger: true,
			registrationNonce: 'REGISTRATION',
			redirectUri: 'REDIRECT',
		};
		const { rerender } = renderHook( ( props: UseConnectionProps ) => useConnection( props ), {
			initialProps,
		} );
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
		const { stubRegisterSite, stubGetSiteIsRegistering } = setupStubs();
		stubGetSiteIsRegistering.mockReturnValue( true );
		const initialProps = { autoTrigger: true };
		renderHook( ( props: UseConnectionProps ) => useConnection( props ), { initialProps } );
		expect( stubRegisterSite ).not.toHaveBeenCalled();
	} );

	it( "doesn't call registerSite if user is connecting", () => {
		const { stubRegisterSite, stubGetUserIsConnecting } = setupStubs();
		stubGetUserIsConnecting.mockReturnValue( true );
		const initialProps = { autoTrigger: true };
		renderHook( ( props: UseConnectionProps ) => useConnection( props ), { initialProps } );
		expect( stubRegisterSite ).not.toHaveBeenCalled();
	} );

	// eslint-disable-next-line jest/no-done-callback
	it( 'calls connectUser after register site', done => {
		const { stubConnectUser } = setupStubs();
		const initialProps = {
			registrationNonce: 'REGISTRATION',
			redirectUri: 'REDIRECT',
			from: 'JETPACK',
		};
		const { result } = renderHook( ( props: UseConnectionProps ) => useConnection( props ), {
			initialProps,
		} );

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
		const { stubRegisterSite, stubConnectUser, stubGetConnectionStatus } = setupStubs();
		stubGetConnectionStatus.mockReturnValue( { isRegistered: true } );
		const { result } = renderHook( ( props: UseConnectionProps ) => useConnection( props ), {
			initialProps: { from: 'JETPACK' },
		} );
		result.current.handleRegisterSite();
		expect( stubRegisterSite ).not.toHaveBeenCalled();
		expect( stubConnectUser ).toHaveBeenCalledTimes( 1 );
		expect( stubConnectUser ).toHaveBeenCalledWith( { from: 'JETPACK', redirectUri: undefined } );
	} );
} );
