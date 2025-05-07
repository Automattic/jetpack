/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import React from 'react';
import DisconnectedCard from '../disconnected-card';

// Mock the WordPress data store
jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
} ) );

// Mock WordPress components
jest.mock( '@wordpress/components', () => ( {
	Path: 'path',
	SVG: 'svg',
	Rect: 'rect',
} ) );

// Mock Jetpack components
jest.mock( '@automattic/jetpack-components', () => ( {
	AutomatticForAgenciesLogo: () => <div>Automattic For Agencies Logo</div>,
	AutomatticIconLogo: () => <div>Automattic Icon Logo</div>,
} ) );

// Mock the jetpack-connection package
jest.mock( '@automattic/jetpack-connection', () => ( {
	CONNECTION_STORE_ID: 'jetpack-connection-store',
	ConnectButton: ( { apiRoot, apiNonce, registrationNonce } ) => (
		<button
			className="components-button"
			data-api-root={ apiRoot }
			data-api-nonce={ apiNonce }
			data-registration-nonce={ registrationNonce }
		>
			Connect Button
		</button>
	),
} ) );

describe( 'DisconnectedCard', () => {
	beforeEach( () => {
		// Mock the global window object
		window.automatticForAgenciesClientInitialState = {
			apiNonce: 'test-api-nonce',
			apiRoot: 'test-api-root',
			registrationNonce: 'test-registration-nonce',
		};

		// Reset useSelect mock before each test
		useSelect.mockReset();
		// Default to empty connection errors
		useSelect.mockReturnValue( {} );
	} );

	test( 'renders the disconnected message', () => {
		render( <DisconnectedCard /> );

		expect(
			screen.getByText( 'Your site was disconnected from Automattic for Agencies' )
		).toBeInTheDocument();
		expect( screen.getByText( 'Site is disconnected' ) ).toBeInTheDocument();
	} );

	test( 'displays connection error message when present', () => {
		// Mock connection errors
		const connectionErrors = {
			invalid_connection_owner: {
				invalid: {
					error_code: 'invalid_connection_owner',
					user_id: 'invalid',
					error_message: 'Invalid connection owner',
				},
			},
		};

		useSelect.mockReturnValue( connectionErrors );

		render( <DisconnectedCard /> );

		expect( screen.queryByText( 'Invalid connection owner' ) ).not.toBeInTheDocument();
	} );
} );
