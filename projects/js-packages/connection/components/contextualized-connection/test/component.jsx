/**
 * External dependencies
 */
import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import ContextualizedConnection from '../index';

// TODO Mock requests with dummy data.
describe( 'ContextualizedConnection', () => {
	const testProps = {
		apiNonce: 'test',
		apiRoot: 'https://example.org/wp-json/',
		redirectUri: 'https://example.org',
		isSiteConnected: false,
		title: 'Test title',
		buttonLabel: 'Test Connect Label',
	};

	describe( 'The contextualized connection screen', () => {
		const wrapper = shallow(
			<ContextualizedConnection { ...testProps }>
				<p>Test content</p>
			</ContextualizedConnection>
		);

		it( 'renders the title', () => {
			expect( wrapper.find( 'h2' ).first().render().text() ).to.be.equal( testProps.title );
		} );

		it( 'renders the connection children', () => {
			expect( wrapper.find( 'p' ).first().render().text() ).to.be.equal( 'Test content' );
		} );

		it( 'renders the footer with a feature list with 3 columns', () => {
			expect( wrapper.find( '.jp-contextualized-connection__footer-column' ) ).to.have.lengthOf(
				3
			);
		} );
	} );

	describe( 'When the user has not connected their WordPress.com account', () => {
		const wrapper = shallow( <ContextualizedConnection { ...testProps } /> );

		it( 'renders the "Set up Jetpack" button', () => {
			expect(
				wrapper.find( '.jp-contextualized-connection__button' ).first().render().text()
			).to.be.equal( testProps.buttonLabel );
		} );

		it( 'renders the TOS', () => {
			expect( wrapper.find( '.jp-contextualized-connection__tos' ) ).to.have.lengthOf( 1 );
		} );
	} );

	describe( 'When the user has connected their WordPress.com account', () => {
		const disconnectedProps = { ...testProps, isSiteConnected: false };
		const wrapper = shallow( <ContextualizedConnection { ...disconnectedProps } /> );

		it( 'renders the "Continue to Jetpack" button', () => {
			expect(
				wrapper.find( '.jp-contextualized-connection__button' ).first().render().text()
			).to.be.equal( 'Continue to Jetpack' );
		} );
	} );
} );
