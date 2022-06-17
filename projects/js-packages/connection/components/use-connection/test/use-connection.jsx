import restApi from '@automattic/jetpack-api';
import { renderHook } from '@testing-library/react-hooks';
import { useSelect, useDispatch } from '@wordpress/data';
import { expect } from 'chai';
import sinon from 'sinon';
import useConnection from '../';
import { STORE_ID } from '../../../state/store';

let storeSelect;

let spySetApiRoot;
let spySetApiNonce;

let stubConnectUser;
let stubRegisterSite;
let stubGetSiteIsRegistering;
let stubGetUserIsConnecting;
let stubGetConnectionStatus;

describe( 'useConnection', () => {
	before( () => {
		const { result: dispatch } = renderHook( () => useDispatch( STORE_ID ) );
		renderHook( () => useSelect( select => ( storeSelect = select( STORE_ID ) ) ) );

		// stubs
		stubRegisterSite = sinon.stub( dispatch.current, 'registerSite' );
		stubConnectUser = sinon.stub( dispatch.current, 'connectUser' );
		stubGetSiteIsRegistering = sinon.stub( storeSelect, 'getSiteIsRegistering' );
		stubGetUserIsConnecting = sinon.stub( storeSelect, 'getUserIsConnecting' );
		stubGetConnectionStatus = sinon.stub( storeSelect, 'getConnectionStatus' );

		// spies
		spySetApiRoot = sinon.spy( restApi, 'setApiRoot' );
		spySetApiNonce = sinon.spy( restApi, 'setApiNonce' );
	} );

	beforeEach( () => {
		// stubs
		stubGetSiteIsRegistering.reset();
		stubGetSiteIsRegistering.returns( false );

		stubGetUserIsConnecting.reset();
		stubGetUserIsConnecting.returns( false );

		stubGetConnectionStatus.reset();
		stubGetConnectionStatus.returns( {} );

		stubRegisterSite.reset();
		stubRegisterSite.resolves();

		stubConnectUser.reset();
		stubConnectUser.returns();

		// spies
		spySetApiRoot.resetHistory();
		spySetApiNonce.resetHistory();
	} );

	it( 'set api root and nonce on start', () => {
		const initialProps = { apiRoot: 'API_ROOT', apiNonce: 'API_NONCE' };
		const { result } = renderHook( props => useConnection( props ), { initialProps } );
		result.current.handleRegisterSite();
		expect( spySetApiRoot.calledOnce ).to.be.true;
		expect( spySetApiNonce.calledOnce ).to.be.true;
	} );

	it( 'calls registerSite automatically', () => {
		const initialProps = {
			autoTrigger: true,
			registrationNonce: 'REGISTRATION',
			redirectUri: 'REDIRECT',
		};
		const { rerender } = renderHook( props => useConnection( props ), { initialProps } );
		expect(
			stubRegisterSite.calledOnceWith( {
				registrationNonce: 'REGISTRATION',
				redirectUri: 'REDIRECT',
			} )
		).to.be.true;
		stubRegisterSite.resetHistory();
		rerender( { autoTrigger: false } );
		expect( stubRegisterSite.called ).to.be.false;
	} );

	it( "doesn't call registerSite if site is registering", () => {
		stubGetSiteIsRegistering.returns( true );
		const initialProps = { autoTrigger: true };
		renderHook( props => useConnection( props ), { initialProps } );
		expect( stubRegisterSite.called ).to.be.false;
	} );

	it( "doesn't call registerSite if user is connecting", () => {
		stubGetUserIsConnecting.returns( true );
		const initialProps = { autoTrigger: true };
		renderHook( props => useConnection( props ), { initialProps } );
		expect( stubRegisterSite.called ).to.be.false;
	} );

	it( 'calls connectUser after register site', done => {
		const initialProps = {
			registrationNonce: 'REGISTRATION',
			redirectUri: 'REDIRECT',
			from: 'JETPACK',
		};
		const { result } = renderHook( props => useConnection( props ), { initialProps } );

		result.current.handleRegisterSite();

		setTimeout( () => {
			expect( stubConnectUser.calledOnceWith( { from: 'JETPACK', redirectUri: 'REDIRECT' } ) ).to.be
				.true;
			done();
		}, 100 );
	} );

	it( 'calls only connectUser if site is registered', () => {
		stubGetConnectionStatus.returns( { isRegistered: true } );
		const { result } = renderHook( props => useConnection( props ), {
			initialProps: { from: 'JETPACK' },
		} );
		result.current.handleRegisterSite();
		expect( stubRegisterSite.called ).to.be.false;
		expect( stubConnectUser.calledOnceWith( { from: 'JETPACK', redirectUri: undefined } ) ).to.be
			.true;
	} );
} );
