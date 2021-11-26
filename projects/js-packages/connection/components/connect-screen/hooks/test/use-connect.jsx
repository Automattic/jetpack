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
	spySetApiNonce,
	storeSelect,
	stubGetSiteIsRegistering,
	stubGetUserIsConnecting;

describe( 'useConnect', () => {
	before( () => {
		const { result: dispatch } = renderHook( () => useDispatch( STORE_ID ) );
		renderHook( () => useSelect( select => ( storeSelect = select( STORE_ID ) ) ) );
		spyRegisterSite = sinon.spy( dispatch.current, 'registerSite' );
		spySetApiRoot = sinon.spy( restApi, 'setApiRoot' );
		spySetApiNonce = sinon.spy( restApi, 'setApiNonce' );
		stubGetSiteIsRegistering = sinon.stub( storeSelect, 'getSiteIsRegistering' );
		stubGetUserIsConnecting = sinon.stub( storeSelect, 'getUserIsConnecting' );
	} );

	beforeEach( () => {
		spyRegisterSite.resetHistory();
		spySetApiRoot.resetHistory();
		spySetApiNonce.resetHistory();
		stubGetSiteIsRegistering.reset();
		stubGetUserIsConnecting.reset();
	} );

	it( 'set api root and nonce on start', () => {
		const initialProps = { apiRoot: 'API_ROOT', apiNonce: 'API_NONCE' };
		renderHook( props => useConnect( props ), { initialProps } );
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
} );
