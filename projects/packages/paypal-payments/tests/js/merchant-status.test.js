/**
 * Tests for the PayPal account status every block in the editor shares.
 *
 * @package
 */

import { store as noticesStore } from '@wordpress/notices';
import { broadcastConnectionChange } from '../../src/paypal-payment-buttons/hooks/use-paypal-connection';
import {
	forgetMerchantStatus,
	loadMerchantStatus,
} from '../../src/paypal-payment-buttons/utils/merchant-status';
const apiFetch = require( '@wordpress/api-fetch' );

const mockCreateWarningNotice = jest.fn();
const mockRemoveNotice = jest.fn();
const mockDispatch = jest.fn( () => ( {
	createWarningNotice: mockCreateWarningNotice,
	removeNotice: mockRemoveNotice,
} ) );

jest.mock( '@wordpress/data', () => ( {
	dispatch: ( ...args ) => mockDispatch( ...args ),
} ) );

jest.mock( '@wordpress/notices', () => ( { store: { name: 'core/notices' } } ) );
// The connection hook reads isPreviewMode from this store; the real one needs all of @wordpress/data.
jest.mock( '@wordpress/block-editor', () => ( { store: { name: 'core/block-editor' } } ) );

// Sample notices; the module shows whatever the server sends. The editor tests use PayPal's wording.
const OLD_ACCOUNT = 'Confirm the old account’s email.';
const NEW_ACCOUNT = 'The new account cannot receive payments.';

/**
 * Let the pending read settle.
 *
 * @return {Promise} Resolves once it has.
 */
const settle = () => new Promise( resolve => setTimeout( resolve ) );

describe( 'merchant status', () => {
	beforeEach( () => {
		forgetMerchantStatus();
		jest.clearAllMocks();
		apiFetch.mockReset();
		apiFetch.mockResolvedValue( { notices: [ OLD_ACCOUNT ] } );
	} );

	it( 'reads the status and shows the warning once, however many blocks ask', async () => {
		loadMerchantStatus();
		loadMerchantStatus();
		await settle();
		loadMerchantStatus();
		await settle();

		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
		expect( apiFetch ).toHaveBeenCalledWith( { path: '/wpcom/v2/paypal/onboarding/status' } );
		expect( mockCreateWarningNotice ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'shows the notice as a dismissible editor warning with a fixed id', async () => {
		loadMerchantStatus();
		await settle();

		expect( mockDispatch ).toHaveBeenCalledWith( noticesStore );
		expect( mockCreateWarningNotice ).toHaveBeenCalledWith( OLD_ACCOUNT, {
			id: 'jetpack-paypal-merchant-status',
			isDismissible: true,
		} );
	} );

	it.each( [
		[ '5xx', { code: 'paypal_api_error', data: { status: 503 } } ],
		[ 'network', new TypeError( 'Failed to fetch' ) ],
		[ '403', { code: 'paypal_merchant_not_for_site', data: { status: 403 } } ],
	] )( 'skips the warning and the retry when the read fails (%s)', async ( _, error ) => {
		apiFetch.mockRejectedValue( error );

		loadMerchantStatus();
		await settle();
		loadMerchantStatus();
		await settle();

		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
		expect( mockCreateWarningNotice ).not.toHaveBeenCalled();
	} );

	it( 'takes the old warning down on a new connection, and shows the new account’s', async () => {
		loadMerchantStatus();
		await settle();
		apiFetch.mockResolvedValue( { notices: [ NEW_ACCOUNT ] } );

		broadcastConnectionChange( true );

		expect( mockRemoveNotice ).toHaveBeenCalledWith( 'jetpack-paypal-merchant-status' );

		loadMerchantStatus();
		await settle();

		expect( apiFetch ).toHaveBeenCalledTimes( 2 );
		expect( mockCreateWarningNotice.mock.calls.map( ( [ message ] ) => message ) ).toEqual( [
			OLD_ACCOUNT,
			NEW_ACCOUNT,
		] );
	} );

	it( 'takes the warning down on a disconnect', () => {
		broadcastConnectionChange( false );

		expect( mockRemoveNotice ).toHaveBeenCalledWith( 'jetpack-paypal-merchant-status' );
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
		expect( mockCreateWarningNotice.mock.calls.map( ( [ message ] ) => message ) ).toEqual( [
			NEW_ACCOUNT,
		] );
	} );
} );
