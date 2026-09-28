import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { clickEvent } from './marketplace-tab-events.ts';

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
