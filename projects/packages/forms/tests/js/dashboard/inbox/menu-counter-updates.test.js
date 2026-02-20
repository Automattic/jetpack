/**
 * External dependencies
 */
import { describe, expect, it, beforeEach } from '@jest/globals';
/**
 * Internal dependencies
 */
import {
	updateMenuCounter,
	updateMenuCounterOptimistically,
} from '../../../../src/dashboard/inbox/utils';

describe( 'Menu counter updates', () => {
	beforeEach( () => {
		document.body.innerHTML = '<span class="jp-feedback-unread-counter count-5">5</span>';
	} );

	it( 'updates counter from server', () => {
		updateMenuCounter( 10 );

		const counter = document.querySelector( '.jp-feedback-unread-counter' );
		expect( counter ).toHaveTextContent( '10' );
		expect( counter ).toHaveClass( 'count-10' );
	} );

	it( 'increments counter optimistically', () => {
		updateMenuCounterOptimistically( 1 );

		const counter = document.querySelector( '.jp-feedback-unread-counter' );
		expect( counter ).toHaveTextContent( '6' );
	} );

	it( 'decrements counter optimistically', () => {
		updateMenuCounterOptimistically( -1 );

		const counter = document.querySelector( '.jp-feedback-unread-counter' );
		expect( counter ).toHaveTextContent( '4' );
	} );

	it( 'server count overrides optimistic updates', () => {
		updateMenuCounterOptimistically( 1 ); // Now 6
		updateMenuCounterOptimistically( 1 ); // Now 7
		updateMenuCounter( 10 ); // Server says 10

		const counter = document.querySelector( '.jp-feedback-unread-counter' );
		expect( counter ).toHaveTextContent( '10' );
	} );
} );
