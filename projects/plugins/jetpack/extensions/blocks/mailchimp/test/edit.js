import { JETPACK_DATA_PATH } from '@automattic/jetpack-shared-extension-utils';
import { render, screen, act, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { registerBlocks } from '../../../shared/test/block-fixtures';
import { settings } from '../../button';
import MailchimpSubscribeEdit from '../edit';

jest.mock( '@wordpress/block-editor', () => ( {
	...jest.requireActual( '@wordpress/block-editor' ),
	InnerBlocks: () => <button>Mocked button</button>,
} ) );

jest.mock( '@wordpress/api-fetch' );

registerBlocks( [ { name: 'jetpack/button', settings } ] );

// Mock values for API responses
const NOT_CONNECTED_API_RESPONSE = {
	code: 'not_connected',
	connect_url: undefined,
};

const CONNECTED_API_RESPONSE = {
	code: 'connected',
	connect_url: 'https://mailchimp.com',
};

const USER_CONNECTION_URL_RESPONSE = 'https://wordpress.com/jetpack/connect';

describe( 'Mailchimp block edit component', () => {
	beforeEach( () => {
		apiFetch.mockClear();
		// Default mock for connected user checking mailchimp status
		apiFetch.mockResolvedValue( NOT_CONNECTED_API_RESPONSE );
	} );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	const setAttributes = jest.fn();

	const attributes = {
		setAttributes,
		emailPlaceholder: 'Enter your email',
		processingLabel: 'Processing ...',
		successLabel: 'Woop woop!',
		errorLabel: 'Dang!',
		preview: false,
	};
	const defaultProps = {
		attributes,
		noticeOperations: {},
	};

	beforeEach( () => {
		setAttributes.mockClear();
		window[ JETPACK_DATA_PATH ] = {
			jetpack: {
				is_current_user_connected: true,
			},
		};
	} );

	test( 'fetches user auth url on mount if current user is not connected', async () => {
		window[ JETPACK_DATA_PATH ] = {
			jetpack: {
				is_current_user_connected: false,
			},
		};
		// Mock the connection URL API response for non-connected users
		apiFetch.mockResolvedValue( USER_CONNECTION_URL_RESPONSE );

		const { container } = render( <MailchimpSubscribeEdit { ...defaultProps } /> );

		// Wait for API call to "finish".
		await waitFor( () => {
			expect(
				// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
				container.querySelector( '.wp-block-jetpack-mailchimp .components-spinner' )
			).not.toBeInTheDocument();
		} );

		expect( apiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				path: expect.stringContaining(
					'/jetpack/v4/connection/url?from=jetpack-block-editor&redirect='
				),
			} )
		);
	} );

	test( 'fetches mailchimp connect url on mount if current user is connected', async () => {
		const { container } = render( <MailchimpSubscribeEdit { ...defaultProps } /> );

		// Wait for API call to "finish".
		await waitFor( () => {
			expect(
				// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
				container.querySelector( '.wp-block-jetpack-mailchimp .components-spinner' )
			).not.toBeInTheDocument();
		} );

		expect( apiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				path: '/wpcom/v2/mailchimp',
				method: 'GET',
			} )
		);
	} );

	test( 'shows set up mailchimp button and recheck connection if not connected', async () => {
		render( <MailchimpSubscribeEdit { ...defaultProps } /> );
		await expect( screen.findByText( 'Set up Mailchimp form' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( 'Re-check Connection' ) ).toBeInTheDocument();
	} );

	test( 'shows enter your email message if connected', async () => {
		apiFetch.mockResolvedValue( CONNECTED_API_RESPONSE );
		const connectedProps = { ...defaultProps, attributes: { ...attributes, preview: true } };
		render( <MailchimpSubscribeEdit { ...connectedProps } /> );
		await expect( screen.findByLabelText( 'Enter your email' ) ).resolves.toBeInTheDocument();

		// Wait for the API call to happen. It makes no differnce to the component, so there's nothing to waitFor for.
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act( () => {} );
	} );
} );
