/**
 * Tests for the snackbar helper.
 *
 * @package
 */

import { store as noticesStore } from '@wordpress/notices';
import { toast } from '../../src/paypal-payment-buttons/utils/toast';

const mockCreateNotice = jest.fn();
const mockDispatch = jest.fn( () => ( { createNotice: mockCreateNotice } ) );

jest.mock( '@wordpress/data', () => ( {
	dispatch: ( ...args ) => mockDispatch( ...args ),
} ) );

jest.mock( '@wordpress/notices', () => ( { store: { name: 'core/notices' } } ) );

describe( 'toast', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	afterEach( () => {
		jest.restoreAllMocks();
	} );

	it( 'creates a snackbar on the notices store', () => {
		toast( 'success', 'Payment link deleted.' );

		expect( mockDispatch ).toHaveBeenCalledWith( noticesStore );
		expect( mockCreateNotice ).toHaveBeenCalledWith( 'success', 'Payment link deleted.', {
			type: 'snackbar',
			id: undefined,
		} );
	} );

	it( 'passes the status through', () => {
		toast( 'error', 'PayPal is unavailable' );

		expect( mockCreateNotice ).toHaveBeenCalledWith(
			'error',
			'PayPal is unavailable',
			expect.objectContaining( { type: 'snackbar' } )
		);
	} );

	// The save sync passes an id so a multi-block save leaves one notice per block.
	it( 'passes an id through when a caller gives one', () => {
		toast( 'warning', 'Not sent to PayPal.', 'jetpack-paypal-held-back-abc' );

		expect( mockCreateNotice ).toHaveBeenCalledWith(
			'warning',
			'Not sent to PayPal.',
			expect.objectContaining( { id: 'jetpack-paypal-held-back-abc' } )
		);
	} );

	// Core's Snackbar owns the timer. A second one would close the wrong notice.
	it( 'leaves dismissal to the editor snackbar', () => {
		const setTimeoutSpy = jest.spyOn( global, 'setTimeout' );

		toast( 'success', 'Payment link deleted.' );

		expect( setTimeoutSpy ).not.toHaveBeenCalled();
	} );
} );
