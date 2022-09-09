import { jest } from '@jest/globals';
import React from 'react';
import { render, screen } from 'test/test-utils';
import ContextualizedConnection from '../index';

describe( 'ContextualizedConnection', () => {
	const testProps = {
		apiNonce: 'test',
		registrationNonce: 'test',
		apiRoot: 'https://example.org/wp-json/',
		redirectUri: 'https://example.org',
		redirectTo: 'Elsewhere',
		isSiteConnected: false,
		title: 'Test title',
		setHasSeenWCConnectionModal: jest.fn(),
	};

	describe( 'The contextualized connection screen', () => {
		it( 'renders the title', () => {
			render(
				<ContextualizedConnection { ...testProps }>
					<p>Test content</p>
				</ContextualizedConnection>
			);
			expect( screen.getByRole( 'heading', { name: testProps.title } ) ).toBeInTheDocument();
		} );

		it( 'renders the connection children', () => {
			render(
				<ContextualizedConnection { ...testProps }>
					<p>Test content</p>
				</ContextualizedConnection>
			);
			expect( screen.getByText( 'Test content' ) ).toBeInTheDocument();
		} );

		it( 'renders the footer with a feature list with 3 columns', () => {
			render(
				<ContextualizedConnection { ...testProps }>
					<p>Test content</p>
				</ContextualizedConnection>
			);
			expect( screen.getByRole( 'heading', { name: 'Security tools' } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'heading', { name: 'Performance tools' } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'heading', { name: 'Growth tools' } ) ).toBeInTheDocument();
		} );
	} );

	describe( 'When the user has not connected their WordPress.com account', () => {
		it( 'renders the "Set up Jetpack" button', () => {
			render( <ContextualizedConnection { ...testProps } /> );
			expect( screen.getByRole( 'button', { name: 'Connect' } ) ).toBeInTheDocument();
		} );

		it( 'renders the TOS', () => {
			render( <ContextualizedConnection { ...testProps } /> );
			expect(
				screen.getByText( /By clicking the button above, you agree to our/ )
			).toBeInTheDocument();
		} );
	} );

	describe( 'When the user has connected their WordPress.com account', () => {
		const disconnectedProps = { ...testProps, isSiteConnected: true };
		it( 'renders the "Continue to Jetpack" button', () => {
			render( <ContextualizedConnection { ...disconnectedProps } /> );
			expect( screen.getByRole( 'link', { name: 'Continue to Jetpack' } ) ).toBeInTheDocument();
		} );
	} );
} );
