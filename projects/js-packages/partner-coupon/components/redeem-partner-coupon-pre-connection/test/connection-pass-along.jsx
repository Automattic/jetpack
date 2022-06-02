import { CONNECTION_STORE_ID, useConnection } from '@automattic/jetpack-connection';
import { renderHook } from '@testing-library/react-hooks';
import { useSelect, useDispatch } from '@wordpress/data';
import { expect } from 'chai';
import sinon from 'sinon';

let storeSelect;
let stubConnectUser;
let stubRegisterSite;
let stubGetConnectionStatus;

describe( 'RedeemPartnerCouponPreConnection', () => {
	before( () => {
		const { result: dispatch } = renderHook( () => useDispatch( CONNECTION_STORE_ID ) );
		renderHook( () => useSelect( select => ( storeSelect = select( CONNECTION_STORE_ID ) ) ) );

		stubConnectUser = sinon.stub( dispatch.current, 'connectUser' );
		stubGetConnectionStatus = sinon.stub( storeSelect, 'getConnectionStatus' );
		stubRegisterSite = sinon.stub( dispatch.current, 'registerSite' );
	} );

	beforeEach( () => {
		stubConnectUser.returns();
		stubGetConnectionStatus.returns( {} );
		stubRegisterSite.resolves();
	} );

	afterEach( () => {
		stubConnectUser.reset();
		stubGetConnectionStatus.reset();
		stubRegisterSite.reset();
	} );

	after( () => {
		stubConnectUser.restore();
		stubGetConnectionStatus.restore();
		stubRegisterSite.restore();
	} );

	it( 'passes along coupon when not connected', done => {
		const initialProps = {
			registrationNonce: 'REGISTRATION',
			redirectUri: 'admin.php?page=jetpack&partnerCoupon=TEST_TST_1234',
			from: 'jetpack-partner-coupon',
		};
		const { result } = renderHook( props => useConnection( props ), { initialProps } );

		result.current.handleRegisterSite();

		setTimeout( () => {
			expect(
				stubRegisterSite.calledOnceWith( {
					registrationNonce: 'REGISTRATION',
					redirectUri: 'admin.php?page=jetpack&partnerCoupon=TEST_TST_1234',
				} )
			);

			expect(
				stubConnectUser.calledOnceWith( {
					from: 'jetpack-partner-coupon',
					redirectUri: 'admin.php?page=jetpack&partnerCoupon=TEST_TST_1234',
				} )
			);
			done();
		}, 50 );
	} );

	it( 'passes along coupon when only site is connected', () => {
		stubGetConnectionStatus.returns( { isRegistered: true } );
		const { result } = renderHook( props => useConnection( props ), {
			initialProps: {
				from: 'jetpack-partner-coupon',
				redirectUri: 'admin.php?page=jetpack&partnerCoupon=TEST_TST_1234',
			},
		} );

		result.current.handleRegisterSite();
		expect( stubRegisterSite.called ).to.be.false;
		expect(
			stubConnectUser.calledOnceWith( {
				from: 'jetpack-partner-coupon',
				redirectUri: 'admin.php?page=jetpack&partnerCoupon=TEST_TST_1234',
			} )
		);
	} );
} );
