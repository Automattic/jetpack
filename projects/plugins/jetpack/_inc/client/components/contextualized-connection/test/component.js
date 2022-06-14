import { shallow } from 'enzyme';
import React from 'react';
import ContextualizedConnection from '../index';

// TODO Mock requests with dummy data.
describe( 'ContextualizedConnection', () => {
	const testProps = {
		apiNonce: 'test',
		registrationNonce: 'test',
		apiRoot: 'https://example.org/wp-json/',
		redirectUri: 'https://example.org',
		redirectTo: 'Elsewhere',
		isSiteConnected: false,
		title: 'Test title',
	};

	describe( 'The contextualized connection screen', () => {
		const wrapper = shallow(
			<ContextualizedConnection { ...testProps }>
				<p>Test content</p>
			</ContextualizedConnection>
		);

		it( 'renders the title', () => {
			expect( wrapper.find( 'h2' ).first().render().text() ).toEqual( testProps.title );
		} );

		it( 'renders the connection children', () => {
			expect( wrapper.find( 'p' ).first().render().text() ).toBe( 'Test content' );
		} );

		it( 'renders the footer with a feature list with 3 columns', () => {
			expect( wrapper.find( '.jp-contextualized-connection__footer-column' ) ).toHaveLength( 3 );
		} );
	} );

	describe( 'When the user has not connected their WordPress.com account', () => {
		const wrapper = shallow( <ContextualizedConnection { ...testProps } /> );

		it( 'renders the "Set up Jetpack" button', () => {
			expect( wrapper.find( 'ConnectButton' ) ).toBeDefined();
		} );

		it( 'renders the TOS', () => {
			expect( wrapper.find( '.jp-contextualized-connection__tos' ) ).toBeDefined();
		} );
	} );

	describe( 'When the user has connected their WordPress.com account', () => {
		const disconnectedProps = { ...testProps, isSiteConnected: true };
		const wrapper = shallow( <ContextualizedConnection { ...disconnectedProps } /> );

		it( 'renders the "Continue to Jetpack" button', () => {
			expect( wrapper.find( '.jp-contextualized-connection__button' ) ).toBeDefined();
		} );
	} );
} );
