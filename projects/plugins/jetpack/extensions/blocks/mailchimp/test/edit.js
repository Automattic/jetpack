import { JETPACK_DATA_PATH } from '@automattic/jetpack-shared-extension-utils';
import { render, screen, act } from '@testing-library/react';
import { registerBlocks } from '../../../shared/test/block-fixtures';
import { settings } from '../../button';
import MailchimpSubscribeEdit from '../edit';

jest.mock( '@wordpress/block-editor', () => ( {
	...jest.requireActual( '@wordpress/block-editor' ),
	InnerBlocks: () => <button>Mocked button</button>,
} ) );

registerBlocks( [ { name: 'jetpack/button', settings } ] );

const originalFetch = window.fetch;

/**
 * Mock return value for a successful fetch JSON return value.
 *
 * @returns {Promise} Mock return value.
 */
const NOT_CONNECTED_RESOLVED_FETCH_PROMISE = Promise.resolve( {
	connected: undefined,
	connect_url: undefined,
} );

const DEFAULT_FETCH_MOCK_RETURN = Promise.resolve( {
	status: 200,
	json: () => NOT_CONNECTED_RESOLVED_FETCH_PROMISE,
} );

const CONNECTED_FETCH_MOCK_RETURN = Promise.resolve( {
	status: 200,
	json: () =>
		Promise.resolve( {
			connected: true,
			connect_url: 'https://mailchimp.com',
		} ),
} );

describe( 'Mailchimp block edit component', () => {
	beforeEach( () => {
		// eslint-disable-next-line jest/prefer-spy-on -- Nothing to spy on.
		window.fetch = jest.fn();
		window.fetch.mockReturnValue( DEFAULT_FETCH_MOCK_RETURN );
	} );

	afterEach( async () => {
		await act( () => NOT_CONNECTED_RESOLVED_FETCH_PROMISE );
	} );

	afterAll( () => {
		window.fetch = originalFetch;
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
		render( <MailchimpSubscribeEdit { ...defaultProps } /> );
		expect( window.fetch ).toHaveBeenCalledWith(
			expect.stringContaining( '/jetpack/v4/connection/url?from=jetpack-block-editor&redirect=' ),
			expect.anything()
		);
	} );

	test( 'fetches mailchimp connect url on mount if current user is connected', async () => {
		render( <MailchimpSubscribeEdit { ...defaultProps } /> );
		expect( window.fetch ).toHaveBeenCalledWith(
			'/wpcom/v2/mailchimp?_locale=user',
			expect.anything()
		);
	} );

	test( 'shows set up mailchimp button and recheck connection if not connected', async () => {
		render( <MailchimpSubscribeEdit { ...defaultProps } /> );
		await expect( screen.findByText( 'Set up Mailchimp form' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( 'Re-check Connection' ) ).toBeInTheDocument();
	} );

	test( 'shows enter your email message if connected', async () => {
		window.fetch.mockReturnValue( CONNECTED_FETCH_MOCK_RETURN );
		const connectedProps = { ...defaultProps, attributes: { ...attributes, preview: true } };
		render( <MailchimpSubscribeEdit { ...connectedProps } /> );
		await expect( screen.findByLabelText( 'Enter your email' ) ).resolves.toBeInTheDocument();
	} );
} );
