/**
 * External dependencies
 */
import '@testing-library/jest-dom/extend-expect';

import { render, screen, act, waitFor } from '@testing-library/react';

// We need to mock InnerBlocks before importing our edit component as it requires the Gutenberg store setup
// to operate
jest.mock( '@wordpress/block-editor', () => ( {
	...jest.requireActual( '@wordpress/block-editor' ),
	InnerBlocks: jest.fn().mockReturnValue( () => {
		return '<button>Mocked button</button>';
	} ),
} ) );

/**
 * Internal dependencies
 */
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

const CONNECTED_RESOLVED_FETCH_PROMISE = Promise.resolve( {
	connected: true,
	connect_url: 'https://mailchimp.com',
} );

const DEFAULT_FETCH_MOCK_RETURN = Promise.resolve( {
	status: 200,
	json: () => NOT_CONNECTED_RESOLVED_FETCH_PROMISE,
} );

const CONNECTED_FETCH_MOCK_RETURN = Promise.resolve( {
	status: 200,
	json: () => CONNECTED_RESOLVED_FETCH_PROMISE,
} );

describe( '', () => {
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
		preview: true,
	};
	const defaultProps = {
		attributes,
		noticeOperations: {},
	};

	beforeEach( () => {
		setAttributes.mockClear();
	} );

	test( 'calls api on mount', async () => {
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

	test.only( 'shows set up mailchimp button and recheck connection if not connected', async () => {
		window.fetch.mockReturnValue( CONNECTED_FETCH_MOCK_RETURN );
		render( <MailchimpSubscribeEdit { ...defaultProps } /> );
		await waitFor( () => screen.getByLabelText( 'Enter your email' ) );
		expect( screen.getByLabelText( 'Enter your email' ) ).toBeInTheDocument();
	} );
} );
