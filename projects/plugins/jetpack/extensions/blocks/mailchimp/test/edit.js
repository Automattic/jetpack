/**
 * External dependencies
 */
import '@testing-library/jest-dom/extend-expect';
import { render, screen, act, waitFor } from '@testing-library/react';

// We need to mock InnerBlocks before importing our edit component as it requires the Gutenberg store setup
// to operate
jest.mock( '@wordpress/block-editor', () => ( {
	...jest.requireActual( '@wordpress/block-editor' ),
	InnerBlocks: () => <button>Mocked button</button>,
} ) );

/**
 * Internal dependencies
 */
import { JETPACK_DATA_PATH } from '../../../shared/get-jetpack-data';
import MailchimpSubscribeEdit from '../edit';
import { settings } from '../../button';
import { registerBlocks } from '../../../shared/test/block-fixtures';

registerBlocks( [ { name: 'jetpack/button', settings } ] );

const originalFetch = window.fetch;

/**
 * Mock return value for a successful fetch JSON return value.
 *
 * @return {Promise} Mock return value.
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
		await waitFor( () => screen.getByText( 'Set up Mailchimp form' ) );
		expect( screen.getByText( 'Set up Mailchimp form' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Re-check Connection' ) ).toBeInTheDocument();
	} );

	test( 'shows enter your email message if connected', async () => {
		window.fetch.mockReturnValue( CONNECTED_FETCH_MOCK_RETURN );
		const connectedProps = { ...defaultProps, attributes: { ...attributes, preview: true } };
		render( <MailchimpSubscribeEdit { ...connectedProps } /> );
		await waitFor( () => screen.getByLabelText( 'Enter your email' ) );
		expect( screen.getByLabelText( 'Enter your email' ) ).toBeInTheDocument();
	} );
} );
