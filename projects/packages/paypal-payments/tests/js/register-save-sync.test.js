/**
 * Tests for the save filter that syncs PayPal payments.
 *
 * @package
 */

import { createReduxStore, register } from '@wordpress/data';
import { addAction, addFilter } from '@wordpress/hooks';
import metadata from '../../src/paypal-payment-buttons/block.json';
import { API_BASE } from '../../src/paypal-payment-buttons/utils/api-base';
import { registerSaveSync } from '../../src/paypal-payment-buttons/utils/register-save-sync';
import {
	forgetSyncedRequests,
	recordPaymentRead,
} from '../../src/paypal-payment-buttons/utils/sync-on-save';
// jest.config.js maps this module to a shared mock.
const apiFetch = require( '@wordpress/api-fetch' );

// The module graph reaches @wordpress/components, which needs a real @wordpress/data.
// So swap these three for store names and register stubs under them below.
jest.mock( '@wordpress/editor', () => ( { store: 'core/editor' } ) );
jest.mock( '@wordpress/notices', () => ( { store: 'core/notices' } ) );
jest.mock( '@wordpress/block-editor', () => ( { store: 'core/block-editor' } ) );

jest.mock( '@wordpress/hooks', () => ( { addAction: jest.fn(), addFilter: jest.fn() } ) );

const mockToast = jest.fn();
jest.mock( '../../src/paypal-payment-buttons/utils/toast', () => ( {
	toast: ( ...args ) => mockToast( ...args ),
} ) );

// What the stub stores answer with. Set per test.
const blocks = new Map();
let savedContent = '';
let editedContent = '';

const noopReducer = ( state = {} ) => state;
const noopAction = () => ( { type: 'NOOP' } );

register(
	createReduxStore( 'core/editor', {
		reducer: noopReducer,
		selectors: {
			// A tripwire. The filter ignores this, but a restored save-time delete would
			// read it and trip the assertions below.
			getCurrentPost: () => ( { id: 17, content: savedContent } ),
			getEditedPostContent: () => editedContent,
		},
		actions: { editPost: noopAction },
	} )
);

register(
	createReduxStore( 'core/block-editor', {
		reducer: noopReducer,
		selectors: {
			getClientIdsWithDescendants: () => [ ...blocks.keys() ],
			getBlock: ( state, clientId ) => blocks.get( clientId ),
		},
		actions: { updateBlockAttributes: noopAction },
	} )
);

register(
	createReduxStore( 'core/notices', {
		reducer: noopReducer,
		selectors: {},
		actions: { createNotice: noopAction, removeNotice: noopAction },
	} )
);

const blockComment = id =>
	`<!-- wp:${ metadata.name } {"isApiManaged":true,"resourceId":"${ id }"} /-->`;

/**
 * A PayPal block complete enough to be sent to PayPal.
 *
 * @param {string} clientId   - Block client id.
 * @param {string} resourceId - The payment it points at, if it has one yet.
 * @return {object} A block.
 */
const payPalBlock = ( clientId, resourceId ) => ( {
	clientId,
	name: metadata.name,
	attributes: {
		isApiManaged: true,
		...( resourceId ? { resourceId } : {} ),
		productName: 'Widget',
		price: '29.99',
		currencyCode: 'USD',
		collectShippingAddress: false,
	},
} );

/**
 * Run the registered `editor.preSavePost` filter.
 *
 * @param {object}  edits     - The edits being saved.
 * @param {object}  options   - Save options, as the editor passes them.
 * @param {string}  afterSync - What the editor holds once the sync has written the
 *                            block attributes, when that differs from the edits.
 * @param {boolean} enabled   - What the API-managed flag says.
 * @return {Promise<object>} What the filter returns.
 */
async function runSaveFilter( edits, options = {}, afterSync, enabled = true ) {
	registerSaveSync( () => enabled );

	expect( addFilter ).toHaveBeenCalledWith(
		'editor.preSavePost',
		expect.any( String ),
		expect.any( Function )
	);
	const [ , , callback ] = addFilter.mock.calls.find(
		( [ hook ] ) => 'editor.preSavePost' === hook
	);

	editedContent = afterSync ?? edits.content;

	return callback( edits, options );
}

/**
 * Run the registered `editor.savePost` action, as the editor does once the post has saved.
 *
 * @param {object} options - Save options, as the editor passes them.
 */
function runSavedAction( options = {} ) {
	const [ , , callback ] = addAction.mock.calls.find( ( [ hook ] ) => 'editor.savePost' === hook );

	callback( { id: 17, type: 'post' }, options );
}

beforeEach( () => {
	blocks.clear();
	savedContent = '';
	editedContent = '';
	jest.clearAllMocks();
	// An unchanged block is not re-sent, and that memo outlives a test.
	forgetSyncedRequests();
	// isConnected() runs before the sync, so the connection has to answer yes for a
	// test to reach what it measures.
	apiFetch.mockImplementation( ( { path } ) =>
		Promise.resolve( path === `${ API_BASE }/connection` ? { connected: true } : {} )
	);
} );

describe( 'registerSaveSync', () => {
	// Two blocks so one survives. With a single block the `! blocks.length` guard
	// short-circuits and this would pass even with the save-time delete restored.
	it( 'keeps the payment when the merchant removes its block', async () => {
		savedContent = `${ blockComment( 'PLB-A1' ) }\n${ blockComment( 'PLB-B2' ) }`;
		blocks.set( 'b', payPalBlock( 'b', 'PLB-B2' ) );
		recordPaymentRead( 'b', 'PLB-B2' );

		const result = await runSaveFilter( { content: blockComment( 'PLB-B2' ) } );

		expect( apiFetch ).not.toHaveBeenCalledWith( expect.objectContaining( { method: 'DELETE' } ) );
		expect( apiFetch ).not.toHaveBeenCalledWith(
			expect.objectContaining( { path: expect.stringContaining( 'PLB-A1' ) } )
		);
		expect( apiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( { path: `${ API_BASE }/buttons/PLB-B2`, method: 'PUT' } )
		);
		expect( result ).toEqual( { content: blockComment( 'PLB-B2' ) } );
	} );

	// Repointing a block at another link drops the first id from the content the same
	// way removing the block does, so the old code deleted it here too.
	it( 'keeps the payment a block was pointed away from', async () => {
		savedContent = blockComment( 'PLB-A1' );
		blocks.set( 'a', payPalBlock( 'a', 'PLB-C3' ) );
		recordPaymentRead( 'a', 'PLB-C3' );

		await runSaveFilter( { content: blockComment( 'PLB-C3' ) } );

		expect( apiFetch ).not.toHaveBeenCalledWith(
			expect.objectContaining( { path: expect.stringContaining( 'PLB-A1' ) } )
		);
		// The block still reaches PayPal, so the assertion above measures something.
		expect( apiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( { path: `${ API_BASE }/buttons/PLB-C3`, method: 'PUT' } )
		);
	} );

	it( 'skips PayPal once the last block is gone', async () => {
		savedContent = blockComment( 'PLB-A1' );

		const result = await runSaveFilter( { content: '' } );

		// The `! blocks.length` guard returns before the connection probe, so this save
		// costs zero requests.
		expect( apiFetch ).not.toHaveBeenCalled();
		expect( result ).toEqual( { content: '' } );
	} );

	it( 'skips PayPal while the API-managed flag is off', async () => {
		blocks.set( 'a', payPalBlock( 'a', 'PLB-A1' ) );

		await runSaveFilter( { content: blockComment( 'PLB-A1' ) }, {}, undefined, false );

		expect( apiFetch ).not.toHaveBeenCalled();
	} );

	it( 'skips PayPal on an autosave', async () => {
		blocks.set( 'a', payPalBlock( 'a', 'PLB-A1' ) );

		await runSaveFilter( { content: blockComment( 'PLB-A1' ) }, { isAutosave: true } );

		expect( apiFetch ).not.toHaveBeenCalled();
	} );

	// The only path that rewrites what the editor is about to save, so a filter that
	// returned the wrong thing here would empty the post.
	it( 'saves the content carrying a new payment id', async () => {
		blocks.set( 'a', payPalBlock( 'a' ) );
		apiFetch.mockImplementation( ( { path, method } ) => {
			if ( path === `${ API_BASE }/connection` ) {
				return Promise.resolve( { connected: true } );
			}
			if ( path === `${ API_BASE }/buttons` && 'POST' === method ) {
				return Promise.resolve( { id: 'PLB-NEW1', payment_link: 'https://example.test/new' } );
			}

			return Promise.resolve( {} );
		} );

		// What the editor holds once the sync writes the new id. The filter hands this
		// back, in place of the content it was given.
		const synced = blockComment( 'PLB-NEW1' );

		const result = await runSaveFilter( { content: '<!-- wp:paragraph /-->' }, {}, synced );

		expect( apiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( { path: `${ API_BASE }/buttons`, method: 'POST' } )
		);
		expect( result.content ).toBe( synced );
	} );

	describe( 'the saved snackbar', () => {
		const saved = message => [ 'success', message, 'jetpack-paypal-saved' ];

		it( 'waits for the post to save', async () => {
			blocks.set( 'a', payPalBlock( 'a', 'PLB-A1' ) );
			recordPaymentRead( 'a', 'PLB-A1' );

			await runSaveFilter( { content: blockComment( 'PLB-A1' ) } );
			expect( mockToast ).not.toHaveBeenCalled();

			runSavedAction();

			expect( mockToast.mock.calls ).toEqual( [ saved( 'Changes saved.' ) ] );
		} );

		// Either request can answer last, so the create has to win from both sides.
		it.each( [ 'PUT', 'POST' ] )(
			'shows one snackbar for several blocks, saying created when any was created (%s answers last)',
			async slow => {
				blocks.set( 'a', payPalBlock( 'a', 'PLB-A1' ) );
				blocks.set( 'b', payPalBlock( 'b' ) );
				recordPaymentRead( 'a', 'PLB-A1' );
				apiFetch.mockImplementation( ( { path, method } ) => {
					if ( path === `${ API_BASE }/connection` ) {
						return Promise.resolve( { connected: true } );
					}
					const response = 'POST' === method ? { id: 'PLB-NEW1' } : {};

					return slow === method
						? new Promise( resolve => setTimeout( () => resolve( response ), 0 ) )
						: Promise.resolve( response );
				} );

				await runSaveFilter( { content: blockComment( 'PLB-A1' ) } );
				runSavedAction();

				expect( apiFetch ).toHaveBeenCalledWith(
					expect.objectContaining( { path: `${ API_BASE }/buttons/PLB-A1`, method: 'PUT' } )
				);
				expect( apiFetch ).toHaveBeenCalledWith(
					expect.objectContaining( { path: `${ API_BASE }/buttons`, method: 'POST' } )
				);
				expect( mockToast.mock.calls ).toEqual( [ saved( 'Payment link successfully created.' ) ] );
			}
		);

		// Nothing was read to compare with, so the PUT counts as a change. Its echo changes no
		// attributes, so the filter returns before the content rewrite.
		it( 'says the changes were saved after a PUT that changes no attributes', async () => {
			blocks.set( 'a', payPalBlock( 'a', 'PLB-A1' ) );
			recordPaymentRead( 'a', 'PLB-A1' );
			const edits = { content: blockComment( 'PLB-A1' ) };

			const result = await runSaveFilter( edits );
			runSavedAction();

			expect( result ).toBe( edits );
			expect( mockToast.mock.calls ).toEqual( [ saved( 'Changes saved.' ) ] );
		} );

		// The first save after a reload PUTs the block even when it matches what was read.
		it( 'stays quiet after a PUT that matches the read', async () => {
			const block = payPalBlock( 'a', 'PLB-A1' );
			blocks.set( 'a', block );
			recordPaymentRead( 'a', 'PLB-A1', block.attributes );

			await runSaveFilter( { content: blockComment( 'PLB-A1' ) } );
			runSavedAction();

			expect( apiFetch ).toHaveBeenCalledWith(
				expect.objectContaining( { path: `${ API_BASE }/buttons/PLB-A1`, method: 'PUT' } )
			);
			expect( mockToast ).not.toHaveBeenCalled();
		} );

		it( 'stays quiet when nothing was sent to PayPal', async () => {
			blocks.set( 'a', payPalBlock( 'a', 'PLB-A1' ) );
			recordPaymentRead( 'a', 'PLB-A1' );
			await runSaveFilter( { content: blockComment( 'PLB-A1' ) } );
			runSavedAction();
			expect( mockToast ).toHaveBeenCalledWith( ...saved( 'Changes saved.' ) );
			mockToast.mockClear();
			apiFetch.mockClear();

			// The same block again is not re-sent.
			await runSaveFilter( { content: blockComment( 'PLB-A1' ) } );
			runSavedAction();

			expect( apiFetch ).not.toHaveBeenCalledWith( expect.objectContaining( { method: 'PUT' } ) );
			expect( mockToast ).not.toHaveBeenCalled();
		} );

		it( 'stays quiet about a block held back', async () => {
			const block = payPalBlock( 'a', 'PLB-A1' );
			blocks.set( 'a', { ...block, attributes: { ...block.attributes, price: '' } } );
			recordPaymentRead( 'a', 'PLB-A1' );

			await runSaveFilter( { content: blockComment( 'PLB-A1' ) } );
			runSavedAction();

			expect( mockToast.mock.calls ).toEqual( [
				[
					'warning',
					'The PayPal button "Widget" was not sent to PayPal: Price is required.',
					'jetpack-paypal-held-back-a',
				],
			] );
		} );

		// The editor skips the action when the post fails to save. The retry has nothing new
		// to send, but the block now points at the payment the failed save created.
		it( "shows a failed save's snackbar on the next save that succeeds", async () => {
			blocks.set( 'a', payPalBlock( 'a' ) );
			apiFetch.mockImplementation( ( { path, method } ) => {
				if ( path === `${ API_BASE }/connection` ) {
					return Promise.resolve( { connected: true } );
				}

				return Promise.resolve( 'POST' === method ? { id: 'PLB-NEW1' } : {} );
			} );
			await runSaveFilter( { content: '' }, {}, blockComment( 'PLB-NEW1' ) );
			expect( mockToast ).not.toHaveBeenCalled();
			blocks.set( 'a', payPalBlock( 'a', 'PLB-NEW1' ) );
			apiFetch.mockClear();

			await runSaveFilter( { content: blockComment( 'PLB-NEW1' ) } );
			runSavedAction();

			expect( apiFetch ).not.toHaveBeenCalledWith(
				expect.objectContaining( { method: expect.stringMatching( /^(POST|PUT)$/ ) } )
			);
			expect( mockToast.mock.calls ).toEqual( [ saved( 'Payment link successfully created.' ) ] );
		} );

		// An autosave sends nothing to PayPal, so it leaves the snackbar for the next save.
		it( "keeps a failed save's snackbar through an autosave", async () => {
			blocks.set( 'a', payPalBlock( 'a', 'PLB-A1' ) );
			recordPaymentRead( 'a', 'PLB-A1' );
			await runSaveFilter( { content: blockComment( 'PLB-A1' ) } );

			await runSaveFilter( { content: blockComment( 'PLB-A1' ) }, { isAutosave: true } );
			runSavedAction( { isAutosave: true } );
			expect( mockToast ).not.toHaveBeenCalled();

			await runSaveFilter( { content: blockComment( 'PLB-A1' ) } );
			runSavedAction();
			runSavedAction();

			expect( mockToast.mock.calls ).toEqual( [ saved( 'Changes saved.' ) ] );
		} );

		it( 'says created when an earlier failed save created the payment', async () => {
			blocks.set( 'a', payPalBlock( 'a' ) );
			apiFetch.mockImplementation( ( { path, method } ) => {
				if ( path === `${ API_BASE }/connection` ) {
					return Promise.resolve( { connected: true } );
				}

				return Promise.resolve( 'POST' === method ? { id: 'PLB-NEW1' } : {} );
			} );
			await runSaveFilter( { content: '' }, {}, blockComment( 'PLB-NEW1' ) );

			// A second failed save, this one an update.
			const block = payPalBlock( 'a', 'PLB-NEW1' );
			blocks.set( 'a', { ...block, attributes: { ...block.attributes, price: '31.00' } } );
			await runSaveFilter( { content: blockComment( 'PLB-NEW1' ) } );
			expect( apiFetch ).toHaveBeenCalledWith(
				expect.objectContaining( { path: `${ API_BASE }/buttons/PLB-NEW1`, method: 'PUT' } )
			);

			await runSaveFilter( { content: blockComment( 'PLB-NEW1' ) } );
			runSavedAction();

			expect( mockToast.mock.calls ).toEqual( [ saved( 'Payment link successfully created.' ) ] );
		} );

		// The PUT went through, so both are true: the payment saved, and the stacked
		// buttons still need another save.
		it( 'shows the saved snackbar beside a stacked read-back error', async () => {
			const block = payPalBlock( 'a', 'PLB-A1' );
			blocks.set( 'a', { ...block, attributes: { ...block.attributes, format: 'STACKED' } } );
			recordPaymentRead( 'a', 'PLB-A1' );

			await runSaveFilter( { content: blockComment( 'PLB-A1' ) } );
			runSavedAction();

			expect( mockToast.mock.calls ).toEqual( [
				[
					'error',
					'There was an issue saving your stacked buttons. Please try again.',
					'jetpack-paypal-sync-a',
				],
				saved( 'Changes saved.' ),
			] );
		} );
	} );
} );
