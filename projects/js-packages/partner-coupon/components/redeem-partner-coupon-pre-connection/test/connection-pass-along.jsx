import { CONNECTION_STORE_ID, useConnection } from '@automattic/jetpack-connection';
import { jest } from '@jest/globals';
import { renderHook } from '@testing-library/react-hooks';
import { useSelect, useDispatch } from '@wordpress/data';

let stubConnectUser;
let stubRegisterSite;
let stubGetConnectionStatus;

describe( 'RedeemPartnerCouponPreConnection', () => {
	const setupSpies = () => {
		const { result: dispatch } = renderHook( () => useDispatch( CONNECTION_STORE_ID ) );
		let storeSelect;
		renderHook( () => useSelect( select => ( storeSelect = select( CONNECTION_STORE_ID ) ) ) );

		stubConnectUser = jest.spyOn( dispatch.current, 'connectUser' ).mockReset();
		stubGetConnectionStatus = jest
			.spyOn( storeSelect, 'getConnectionStatus' )
			.mockReset()
			.mockReturnValue( {} );
		stubRegisterSite = jest
			.spyOn( dispatch.current, 'registerSite' )
			.mockReset()
			.mockResolvedValue();
	};

	// eslint-disable-next-line jest/no-done-callback
	it( 'passes along coupon when not connected', done => {
		setupSpies();
		const initialProps = {
			registrationNonce: 'REGISTRATION',
			redirectUri: 'admin.php?page=jetpack&partnerCoupon=TEST_TST_1234',
			from: 'jetpack-partner-coupon',
		};
		const { result } = renderHook( props => useConnection( props ), { initialProps } );

		result.current.handleRegisterSite();

		setTimeout( () => {
			expect( stubRegisterSite ).toHaveBeenCalledTimes( 1 );
			expect( stubRegisterSite ).toHaveBeenCalledWith( {
				registrationNonce: 'REGISTRATION',
				redirectUri: 'admin.php?page=jetpack&partnerCoupon=TEST_TST_1234',
			} );

			expect( stubConnectUser ).toHaveBeenCalledTimes( 1 );
			expect( stubConnectUser ).toHaveBeenCalledWith( {
				from: 'jetpack-partner-coupon',
				redirectUri: 'admin.php?page=jetpack&partnerCoupon=TEST_TST_1234',
			} );
			done();
		}, 50 );
	} );

	it( 'passes along coupon when only site is connected', () => {
		setupSpies();
		stubGetConnectionStatus.mockReturnValue( { isRegistered: true } );
		const { result } = renderHook( props => useConnection( props ), {
			initialProps: {
				from: 'jetpack-partner-coupon',
				redirectUri: 'admin.php?page=jetpack&partnerCoupon=TEST_TST_1234',
			},
		} );

		result.current.handleRegisterSite();
		expect( stubRegisterSite ).not.toHaveBeenCalled();
		expect( stubConnectUser ).toHaveBeenCalledTimes( 1 );
		expect( stubConnectUser ).toHaveBeenCalledWith( {
			from: 'jetpack-partner-coupon',
			redirectUri: 'admin.php?page=jetpack&partnerCoupon=TEST_TST_1234',
		} );
	} );
} );
