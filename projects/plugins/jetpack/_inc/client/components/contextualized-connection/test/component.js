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
		buttonLabel: 'Setup Jetpack',
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
		it( 'renders the connection button', () => {
			render( <ContextualizedConnection { ...testProps } /> );
			expect( screen.getByRole( 'button', { name: testProps.buttonLabel } ) ).toBeInTheDocument();
		} );

		it( 'renders terms of service text that references the connection button label', () => {
			render( <ContextualizedConnection { ...testProps } /> );
			expect(
				screen.getByText(
					( content, element ) =>
						content !== '' && // filter out parent elements
						element.textContent.startsWith(
							`By clicking ${ testProps.buttonLabel }, you agree to our Terms of Service`
						)
				)
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
