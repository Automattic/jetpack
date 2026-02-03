/**
 * External dependencies
 */
import { describe, expect, it, beforeEach } from '@jest/globals';
/**
 * Internal dependencies
 */
import { optimisticallyUpdateUnreadCount } from '../../../../src/dashboard/inbox/stage/process-status-change';

describe( 'optimisticallyUpdateUnreadCount', () => {
	beforeEach( () => {
		document.body.innerHTML = '<span class="jp-feedback-unread-counter count-5">5</span>';
	} );

	it( 'does not change counter for read items', () => {
		optimisticallyUpdateUnreadCount( 'spam', 'publish', false );

		const counter = document.querySelector( '.jp-feedback-unread-counter' );
		expect( counter ).toHaveTextContent( '5' );
	} );

	it( 'decrements counter when moving unread item from publish to spam', () => {
		optimisticallyUpdateUnreadCount( 'spam', 'publish', true );

		const counter = document.querySelector( '.jp-feedback-unread-counter' );
		expect( counter ).toHaveTextContent( '4' );
	} );

	it( 'decrements counter when moving unread item from publish to trash', () => {
		optimisticallyUpdateUnreadCount( 'trash', 'publish', true );

		const counter = document.querySelector( '.jp-feedback-unread-counter' );
		expect( counter ).toHaveTextContent( '4' );
	} );

	it( 'increments counter when restoring unread item to publish', () => {
		optimisticallyUpdateUnreadCount( 'publish', 'spam', true );

		const counter = document.querySelector( '.jp-feedback-unread-counter' );
		expect( counter ).toHaveTextContent( '6' );
	} );

	it( 'does not change counter when moving between spam and trash', () => {
		optimisticallyUpdateUnreadCount( 'trash', 'spam', true );

		const counter = document.querySelector( '.jp-feedback-unread-counter' );
		expect( counter ).toHaveTextContent( '5' );
	} );
} );
