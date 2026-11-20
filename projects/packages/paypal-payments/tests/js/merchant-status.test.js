/**
 * Tests for the PayPal account status every block in the editor shares.
 *
 * @package
 */

import { broadcastConnectionChange } from '../../src/paypal-payment-buttons/hooks/use-paypal-connection';
import {
	forgetMerchantStatus,
	getMerchantNotices,
	loadMerchantStatus,
	subscribeToMerchantStatus,
} from '../../src/paypal-payment-buttons/utils/merchant-status';
const apiFetch = require( '@wordpress/api-fetch' );

// Sample notices; the module passes on whatever the server sends. The editor tests use PayPal's wording.
const OLD_ACCOUNT = 'Confirm the old account’s email.';
const NEW_ACCOUNT = 'The new account cannot receive payments.';

/**
 * Let the pending read settle.
 *
 * @return {Promise} Resolves once it has.
 */
const settle = () => new Promise( resolve => setTimeout( resolve ) );

describe( 'merchant status', () => {
	const listener = jest.fn();
	let unsubscribe;

	beforeEach( () => {
		forgetMerchantStatus();
		jest.clearAllMocks();
		apiFetch.mockReset();
		apiFetch.mockResolvedValue( { notices: [ OLD_ACCOUNT ] } );
		unsubscribe = subscribeToMerchantStatus( listener );
	} );

	afterEach( () => {
		unsubscribe();
	} );

	it( 'reads the status once and keeps its notices, however many blocks ask', async () => {
		loadMerchantStatus();
		loadMerchantStatus();
		await settle();
		loadMerchantStatus();
		await settle();

		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
		expect( apiFetch ).toHaveBeenCalledWith( { path: '/wpcom/v2/paypal/onboarding/status' } );
		expect( getMerchantNotices() ).toEqual( [ OLD_ACCOUNT ] );
		expect( listener ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'keeps the notices empty before the read and for an account in good standing', async () => {
		expect( getMerchantNotices() ).toEqual( [] );

		apiFetch.mockResolvedValue( { notices: [] } );
		loadMerchantStatus();
		await settle();

		expect( getMerchantNotices() ).toEqual( [] );
		expect( listener ).not.toHaveBeenCalled();
	} );

	it.each( [
		[ '5xx', { code: 'paypal_api_error', data: { status: 503 } } ],
		[ 'network', new TypeError( 'Failed to fetch' ) ],
		[ '403', { code: 'paypal_merchant_not_for_site', data: { status: 403 } } ],
	] )( 'keeps the notices empty and reads once when the read fails (%s)', async ( _, error ) => {
		apiFetch.mockRejectedValue( error );

		loadMerchantStatus();
		await settle();
		loadMerchantStatus();
		await settle();

		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
		expect( getMerchantNotices() ).toEqual( [] );
		expect( listener ).not.toHaveBeenCalled();
	} );

	it( 'clears the old notices on a new connection, then reads the new account’s', async () => {
		loadMerchantStatus();
		await settle();
		apiFetch.mockResolvedValue( { notices: [ NEW_ACCOUNT ] } );

		broadcastConnectionChange( true );

		expect( getMerchantNotices() ).toEqual( [] );

		loadMerchantStatus();
		await settle();

		expect( apiFetch ).toHaveBeenCalledTimes( 2 );
		expect( getMerchantNotices() ).toEqual( [ NEW_ACCOUNT ] );
		expect( listener ).toHaveBeenCalledTimes( 3 );
	} );

	it( 'clears the notices on a disconnect', async () => {
		loadMerchantStatus();
		await settle();

		broadcastConnectionChange( false );

		expect( getMerchantNotices() ).toEqual( [] );
		expect( listener ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'stops calling a listener once it unsubscribes', async () => {
		unsubscribe();

		loadMerchantStatus();
		await settle();
		forgetMerchantStatus();

		expect( listener ).not.toHaveBeenCalled();
	} );

	it( 'drops the old account’s read when it answers after a connection change', async () => {
		let answerOldRead;
		apiFetch.mockReturnValueOnce(
			new Promise( resolve => {
				answerOldRead = resolve;
			} )
		);
		loadMerchantStatus();

		broadcastConnectionChange( true );

		apiFetch.mockResolvedValue( { notices: [ NEW_ACCOUNT ] } );
		loadMerchantStatus();
		await settle();
		answerOldRead( { notices: [ OLD_ACCOUNT ] } );
		await settle();

		expect( apiFetch ).toHaveBeenCalledTimes( 2 );
		expect( getMerchantNotices() ).toEqual( [ NEW_ACCOUNT ] );
	} );
} );
