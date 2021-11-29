/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react-hooks';
import restApi from '@automattic/jetpack-api';
import { useSelect, useDispatch } from '@wordpress/data';
import sinon from 'sinon';
import { expect } from 'chai';

/**
 * Internal dependencies
 */
import { STORE_ID } from '../../../../state/store';
import useConnect from '../use-connect';

let spySetApiRoot,
	spyRegisterSite,
	spySetUserIsConnecting,
	spySetApiNonce,
	storeSelect,
	stubGetSiteIsRegistering,
	stubGetUserIsConnecting,
	stubGetConnectionStatus;

describe( 'useConnect', () => {
	before( () => {
		const { result: dispatch } = renderHook( () => useDispatch( STORE_ID ) );
		renderHook( () => useSelect( select => ( storeSelect = select( STORE_ID ) ) ) );

		// stubs
		stubGetSiteIsRegistering = sinon.stub( storeSelect, 'getSiteIsRegistering' );
		stubGetUserIsConnecting = sinon.stub( storeSelect, 'getUserIsConnecting' );
		stubGetConnectionStatus = sinon.stub( storeSelect, 'getConnectionStatus' );

		// spies
		spyRegisterSite = sinon.spy( dispatch.current, 'registerSite' );
		spySetUserIsConnecting = sinon.spy( dispatch.current, 'setUserIsConnecting' );
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

		// spies
		spyRegisterSite.resetHistory();
		spySetUserIsConnecting.resetHistory();
		spySetApiRoot.resetHistory();
		spySetApiNonce.resetHistory();
	} );

	it( 'set api root and nonce on start', () => {
		const initialProps = { apiRoot: 'API_ROOT', apiNonce: 'API_NONCE' };
		const { result } = renderHook( props => useConnect( props ), { initialProps } );
		result.current.handleRegisterSite();
		expect( spySetApiRoot.calledOnce ).to.be.true;
		expect( spySetApiNonce.calledOnce ).to.be.true;
	} );

	it( 'calls registerSite automatically based on autoTrigger', () => {
		const initialProps = { autoTrigger: true };
		const { rerender } = renderHook( props => useConnect( props ), { initialProps } );
		expect( spyRegisterSite.called ).to.be.true;
		spyRegisterSite.resetHistory();
		rerender( { autoTrigger: false } );
		expect( spyRegisterSite.called ).to.be.false;
	} );

	it( 'does not call handleRegisterSite if siteIsRegistering is true', () => {
		stubGetSiteIsRegistering.returns( true );
		const initialProps = { autoTrigger: true };
		renderHook( props => useConnect( props ), { initialProps } );
		expect( spyRegisterSite.called ).to.be.false;
	} );

	it( 'does not call handleRegisterSite if userIsConnecting is true', () => {
		stubGetUserIsConnecting.returns( true );
		const initialProps = { autoTrigger: true };
		renderHook( props => useConnect( props ), { initialProps } );
		expect( spyRegisterSite.called ).to.be.false;
	} );

	it( 'set user is connecting to true and do not call registerSite', () => {
		stubGetConnectionStatus.returns( { isRegistered: true } );
		const { result } = renderHook( props => useConnect( props ), { initialProps: {} } );
		result.current.handleRegisterSite();
		expect( spySetUserIsConnecting.calledOnce ).to.be.true;
		expect( spyRegisterSite.calledOnce ).to.be.false;
	} );
} );
