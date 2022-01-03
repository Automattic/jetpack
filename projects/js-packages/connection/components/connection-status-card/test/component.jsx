/**
 * External dependencies
 */
import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { useSelect } from '@wordpress/data';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';

/**
 * Internal dependencies
 */
import ConnectionStatusCard from '../index';
import { STORE_ID } from '../../../state/store';

let stubGetConnectionStatus;
let storeSelect;
let wrapper;

// TODO Mock requests with dummy data.
describe( 'ConnectionStatusCard', () => {
	const testProps = {
		apiNonce: 'test',
		apiRoot: 'https://example.org/wp-json/',
		redirectUri: 'https://example.org',
	};

	before( () => {
		renderHook( () => useSelect( select => ( storeSelect = select( STORE_ID ) ) ) );
		stubGetConnectionStatus = sinon.stub( storeSelect, 'getConnectionStatus' );
	} );

	after( function () {
		storeSelect.getConnectionStatus.restore();
	} );

	describe( 'When the user has not connected their WordPress.com account', () => {
		beforeEach( () => {
			stubGetConnectionStatus.reset();
			stubGetConnectionStatus.returns( { isRegistered: true, isUserConnected: false } );
			wrapper = shallow( <ConnectionStatusCard { ...testProps } /> );
		} );

		it( 'renders the title', () => {
			expect( wrapper.find( 'h3' ).first().render().text() ).to.be.equal( 'Connection' );
		} );

		it( 'renders the connection info', () => {
			expect( wrapper.find( 'p' ).first().render().text() ).to.be.equal(
				'Leverages the Jetpack Cloud for more features on your side.'
			);
		} );

		it( 'renders the "Site connected" success list item', () => {
			expect(
				wrapper.find( '.jp-connection-status-card--list-item-success' ).first().render().text()
			).to.be.equal( 'Site connected.\u00a0Disconnect' );
		} );

		it( 'renders the "DisconnectDialog"', () => {
			expect( wrapper.find( 'DisconnectDialog' ) ).to.exist;
		} );

		it( 'renders the "Account not connected" error list item', () => {
			expect(
				wrapper.find( '.jp-connection-status-card--list-item-error' ).first().render().text()
			).to.be.equal( 'Your WordPress.com account is not connected.' );
		} );

		it( 'renders the "Connect your WordPress.com account" button', () => {
			expect( wrapper.find( '.jp-connection-status-card--btn-connect-user' ) ).to.have.lengthOf(
				1
			);
		} );
	} );

	describe( 'When the user has connected their WordPress.com account', () => {
		beforeEach( () => {
			stubGetConnectionStatus.reset();
			stubGetConnectionStatus.returns( { isRegistered: true, isUserConnected: true } );
			wrapper = shallow( <ConnectionStatusCard { ...testProps } /> );
		} );

		it( 'renders the title', () => {
			expect( wrapper.find( 'h3' ).first().render().text() ).to.be.equal( 'Connection' );
		} );

		it( 'renders the connection info', () => {
			expect( wrapper.find( 'p' ).first().render().text() ).to.be.equal(
				'Leverages the Jetpack Cloud for more features on your side.'
			);
		} );

		it( 'renders the "Site connected" success list item', () => {
			expect(
				wrapper.find( '.jp-connection-status-card--list-item-success' ).first().render().text()
			).to.be.equal( 'Site connected.\u00a0Disconnect' );
		} );

		it( 'renders the "DisconnectDialog"', () => {
			expect( wrapper.find( 'DisconnectDialog' ) ).to.exist;
		} );

		it( 'renders the "Logged in as" success list item', () => {
			expect(
				wrapper.find( '.jp-connection-status-card--list-item-success' ).at( 1 ).render().text()
			).to.be.equal( 'Logged in as ' );
		} );

		it( 'doesn\'t render the "Connect your WordPress.com account" button', () => {
			expect( wrapper.find( '.jp-connection-status-card--btn-connect-user' ) ).to.have.lengthOf(
				0
			);
		} );
	} );
} );
