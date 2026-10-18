import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { clickEvent, trackMarketplaceTab } from './marketplace-tab-tracks.ts';

describe( 'clickEvent', () => {
	it( 'names each tracked link and sends the props Calypso sends', () => {
		assert.deepEqual( clickEvent( 'purchase', { plugin: 'gravityforms', saas: 'false' } ), [
			'wpcom_marketplace_tab_purchase_click',
			{ plugin: 'gravityforms', is_saas_product: false },
		] );
		assert.deepEqual( clickEvent( 'get_started', { plugin: 'mailpoet-business', saas: 'true' } ), [
			'wpcom_marketplace_tab_get_started_click',
			{ plugin: 'mailpoet-business', is_saas_product: true },
		] );
		assert.equal(
			clickEvent( 'details', { plugin: 'gravityforms' } )?.[ 0 ],
			'wpcom_marketplace_tab_details_click'
		);
	} );

	it( 'ignores a link it does not know', () => {
		assert.equal( clickEvent( 'toString', { plugin: 'gravityforms' } ), null );
		assert.equal( clickEvent( undefined, { plugin: 'gravityforms' } ), null );
	} );

	it( 'ignores a card with no product slug', () => {
		assert.equal( clickEvent( 'purchase', {} ), null );
	} );
} );

describe( 'trackMarketplaceTab', () => {
	const card = { dataset: { plugin: 'mailpoet-business', saas: 'true' } };
	const link = {
		dataset: { wpcomMarketplaceTrack: 'get_started' },
		closest: ( selector: string ) => ( selector === '.wpcom-marketplace-card' ? card : null ),
	};

	/**
	 * A page with a grid of two cards, recording what it is told to track.
	 *
	 * @return The page, the recorded events, and a way to click inside the grid.
	 */
	function page() {
		type OnClick = ( event: { target: unknown } ) => void;

		const events: unknown[] = [];
		let onClick: OnClick | undefined;
		const grid = {
			querySelectorAll: () => ( { length: 2 } ),
			addEventListener: ( _type: string, handler: OnClick ) => ( onClick = handler ),
		};
		const doc = { querySelector: () => grid } as unknown as Document;

		trackMarketplaceTab( doc, ( ...event ) => events.push( event ) );

		return { events, click: ( target: unknown ) => onClick?.( { target } ) };
	}

	it( 'records the view with the number of cards', () => {
		assert.deepEqual( page().events, [ [ 'wpcom_marketplace_tab_view', { plugin_count: 2 } ] ] );
	} );

	it( 'records a click on a tracked link, and nothing for anywhere else', () => {
		const { events, click } = page();

		click( { closest: () => link } );
		click( { closest: () => null } );

		assert.deepEqual( events.slice( 1 ), [
			[
				'wpcom_marketplace_tab_get_started_click',
				{ plugin: 'mailpoet-business', is_saas_product: true },
			],
		] );
	} );

	it( 'still records the view when the catalog could not be loaded', () => {
		const events: unknown[] = [];
		const doc = { querySelector: () => null } as unknown as Document;

		trackMarketplaceTab( doc, ( ...event ) => events.push( event ) );

		assert.deepEqual( events, [ [ 'wpcom_marketplace_tab_view', { plugin_count: 0 } ] ] );
	} );
} );
