import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { useSelect, useDispatch } from '@wordpress/data';
import { NewsletterTestEmailModal, NewsletterPreviewModal } from '../email-preview';

jest.mock( '@wordpress/api-fetch' );

// Controls what `useConnection()` reports; toggled per test.
let mockIsUserConnected = true;

jest.mock( '@automattic/jetpack-connection', () => ( {
	getUserConnectionUrl: () => 'https://example.com/connect',
	useConnection: () => ( { isUserConnected: mockIsUserConnected } ),
} ) );

// Treat the site as self-hosted so the connection gate applies.
jest.mock( '@automattic/jetpack-script-data', () => ( {
	isSimpleSite: () => false,
} ) );

jest.mock( '@automattic/jetpack-shared-extension-utils', () => {
	// Return a stable reference so `tracks` identity doesn't change between
	// renders — otherwise the preview modal's memoized fetch effect re-fires.
	const analytics = { tracks: { recordEvent: jest.fn() } };
	return {
		...jest.requireActual( '@automattic/jetpack-shared-extension-utils' ),
		useAnalytics: () => analytics,
	};
} );

// `@wordpress/ui` isn't resolvable in the jest environment; render a plain anchor.
jest.mock( '@wordpress/ui', () => ( {
	Link: ( { children, href } ) => <a href={ href }>{ children }</a>,
} ) );

jest.mock( '@wordpress/data', () => {
	const actual = jest.requireActual( '@wordpress/data' );
	const mocks = {
		useSelect: jest.fn(),
		useDispatch: jest.fn(),
	};
	return new Proxy( actual, {
		get( target, property ) {
			return mocks[ property ] ?? target[ property ];
		},
	} );
} );

const MISSING_CONNECTION_ERROR = {
	code: 'rest_cannot_send_email_preview',
	message: 'Please connect your user account to WordPress.com',
	data: { status: 403 },
};

describe( 'Email preview connection errors', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockIsUserConnected = true;
		useSelect.mockImplementation( () => 123 );
		useDispatch.mockReturnValue( {
			__unstableSaveForPreview: jest.fn().mockResolvedValue( undefined ),
		} );
	} );

	it( 'disables Send and prompts to connect on open when the user is not connected', () => {
		mockIsUserConnected = false;

		render( <NewsletterTestEmailModal isOpen onClose={ jest.fn() } /> );

		// The prompt is shown immediately, without any interaction…
		expect( screen.getByRole( 'link', { name: 'Connect your account' } ) ).toBeInTheDocument();
		// …the Send button is disabled…
		expect( screen.getByRole( 'button', { name: /Send/ } ) ).toBeDisabled();
		// …and no request is attempted.
		expect( apiFetch ).not.toHaveBeenCalled();
	} );

	it( 'keeps Send enabled and shows no prompt on open when the user is connected', () => {
		render( <NewsletterTestEmailModal isOpen onClose={ jest.fn() } /> );

		expect(
			screen.queryByRole( 'link', { name: 'Connect your account' } )
		).not.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: /Send/ } ) ).toBeEnabled();
	} );

	it( 'prompts the user to connect when sending a test email fails with a missing connection', async () => {
		const user = userEvent.setup();
		apiFetch.mockRejectedValue( MISSING_CONNECTION_ERROR );

		render( <NewsletterTestEmailModal isOpen onClose={ jest.fn() } /> );

		await user.click( screen.getByRole( 'button', { name: /Send/ } ) );

		const connectLink = await screen.findByRole( 'link', { name: 'Connect your account' } );
		expect( connectLink ).toHaveAttribute( 'href', 'https://example.com/connect' );
	} );

	it( 'surfaces the raw message for non-connection send errors', async () => {
		const user = userEvent.setup();
		apiFetch.mockRejectedValue( { code: 'rest_something_else', message: 'Boom' } );

		render( <NewsletterTestEmailModal isOpen onClose={ jest.fn() } /> );

		await user.click( screen.getByRole( 'button', { name: /Send/ } ) );

		await expect( screen.findByText( /Boom/ ) ).resolves.toBeInTheDocument();
		expect(
			screen.queryByRole( 'link', { name: 'Connect your account' } )
		).not.toBeInTheDocument();
	} );

	it( 'prompts the user to connect when the HTML preview fails with a missing connection', async () => {
		apiFetch.mockRejectedValue( MISSING_CONNECTION_ERROR );

		render( <NewsletterPreviewModal isOpen postId={ 123 } onClose={ jest.fn() } /> );

		const connectLink = await screen.findByRole( 'link', { name: 'Connect your account' } );
		expect( connectLink ).toHaveAttribute( 'href', 'https://example.com/connect' );
	} );

	it( 'shows the generic error (with retry) for non-connection preview errors', async () => {
		apiFetch.mockRejectedValue( { code: 'rest_something_else', message: 'Boom' } );

		render( <NewsletterPreviewModal isOpen postId={ 123 } onClose={ jest.fn() } /> );

		await expect(
			screen.findByRole( 'button', { name: 'Try again' } )
		).resolves.toBeInTheDocument();
		expect(
			screen.queryByRole( 'link', { name: 'Connect your account' } )
		).not.toBeInTheDocument();
	} );
} );
