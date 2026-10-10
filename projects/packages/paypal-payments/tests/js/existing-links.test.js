/**
 * Tests for the list of existing payment links every block in the editor shares.
 *
 * @package
 */

import { broadcastConnectionChange } from '../../src/paypal-payment-buttons/hooks/use-paypal-connection';
import {
	addExistingLink,
	forgetExistingLinks,
	getExistingLinks,
	loadExistingLinks,
	markExistingLinksDirty,
	removeExistingLink,
} from '../../src/paypal-payment-buttons/utils/existing-links';
const apiFetch = require( '@wordpress/api-fetch' );

const croissant = { id: 'PLB-A1', line_items: [ { name: 'Croissant' } ] };
const scone = { id: 'PLB-N1', line_items: [ { name: 'Scone' } ] };

/**
 * Let the pending read settle.
 *
 * @return {Promise} Resolves once it has.
 */
const settle = () => new Promise( resolve => setTimeout( resolve ) );

const ids = () => getExistingLinks().links.map( link => link.id );

describe( 'existing links', () => {
	beforeEach( () => {
		apiFetch.mockReset();
		apiFetch.mockResolvedValue( { resources: [ croissant ] } );
		forgetExistingLinks();
	} );

	it( 'reads the list once for every block that asks', async () => {
		loadExistingLinks();
		loadExistingLinks();
		await settle();
		loadExistingLinks();

		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
		expect( getExistingLinks() ).toEqual( { links: [ croissant ], loaded: true } );
	} );

	it( 'shows an empty list after a failed read, and reads it again next time', async () => {
		apiFetch.mockRejectedValueOnce( new Error( 'down' ) );
		loadExistingLinks();
		await settle();

		expect( getExistingLinks() ).toEqual( { links: [], loaded: true } );

		loadExistingLinks();
		await settle();

		expect( apiFetch ).toHaveBeenCalledTimes( 2 );
		expect( ids() ).toEqual( [ 'PLB-A1' ] );
	} );

	it( 'keeps the list it has when a read fails', async () => {
		loadExistingLinks();
		await settle();
		markExistingLinksDirty();
		apiFetch.mockRejectedValueOnce( new Error( 'down' ) );
		loadExistingLinks();
		await settle();

		expect( getExistingLinks() ).toEqual( { links: [ croissant ], loaded: true } );
	} );

	it( 'reads the list again once it is marked dirty', async () => {
		loadExistingLinks();
		await settle();
		apiFetch.mockResolvedValue( { resources: [ scone, croissant ] } );

		markExistingLinksDirty();
		loadExistingLinks();

		// The current list stays up until the new one is in.
		expect( getExistingLinks() ).toEqual( { links: [ croissant ], loaded: true } );
		await settle();
		expect( apiFetch ).toHaveBeenCalledTimes( 2 );
		expect( ids() ).toEqual( [ 'PLB-N1', 'PLB-A1' ] );
	} );

	it( 'waits for the next read when an empty list is marked dirty', async () => {
		apiFetch.mockResolvedValueOnce( { resources: [] } );
		loadExistingLinks();
		await settle();

		markExistingLinksDirty();

		expect( getExistingLinks() ).toEqual( { links: [], loaded: false } );
		loadExistingLinks();
		await settle();
		expect( getExistingLinks() ).toEqual( { links: [ croissant ], loaded: true } );
	} );

	it( 'reads the list again when marked dirty during a read', async () => {
		loadExistingLinks();
		markExistingLinksDirty();
		await settle();
		loadExistingLinks();

		expect( apiFetch ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'puts a new link first, once', async () => {
		loadExistingLinks();
		await settle();

		addExistingLink( scone );
		addExistingLink( scone );

		expect( ids() ).toEqual( [ 'PLB-N1', 'PLB-A1' ] );
	} );

	it( 'reads the list again when a link is created during a read', async () => {
		loadExistingLinks();
		addExistingLink( scone );
		await settle();
		// The answer predates the link, so it shows after the next read.
		expect( ids() ).toEqual( [ 'PLB-A1' ] );
		apiFetch.mockResolvedValue( { resources: [ scone, croissant ] } );
		loadExistingLinks();
		await settle();

		expect( apiFetch ).toHaveBeenCalledTimes( 2 );
		expect( ids() ).toEqual( [ 'PLB-N1', 'PLB-A1' ] );
	} );

	it( 'drops a link deleted during a read from its answer', async () => {
		loadExistingLinks();
		removeExistingLink( 'PLB-A1' );
		await settle();

		expect( getExistingLinks() ).toEqual( { links: [], loaded: true } );
	} );

	it( 'adds a new link only to a list already read', () => {
		addExistingLink( scone );

		expect( getExistingLinks() ).toEqual( { links: [], loaded: false } );
	} );

	it( 'reads the list again after a reconnect, and drops the read sent before it', async () => {
		let answerOldRead;
		apiFetch.mockReturnValueOnce(
			new Promise( resolve => {
				answerOldRead = resolve;
			} )
		);
		loadExistingLinks();

		broadcastConnectionChange( true );
		expect( getExistingLinks() ).toEqual( { links: [], loaded: false } );

		apiFetch.mockResolvedValue( { resources: [ scone ] } );
		loadExistingLinks();
		await settle();
		answerOldRead( { resources: [ croissant ] } );
		await settle();

		expect( apiFetch ).toHaveBeenCalledTimes( 2 );
		expect( getExistingLinks() ).toEqual( { links: [ scone ], loaded: true } );
	} );
} );
