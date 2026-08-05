import { render, screen, waitFor } from '@testing-library/react';
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

// Error messages render inside a `Notice`, which mirrors its text into
// @wordpress/a11y's global live region — so the message exists twice in the
// DOM. Scope message assertions to the visible copy by ignoring that region.
const IGNORE_LIVE_REGION = { ignore: '.a11y-speak-region' };

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

		await expect( screen.findByText( /Boom/, IGNORE_LIVE_REGION ) ).resolves.toBeInTheDocument();
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

describe( 'Test email recipient', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockIsUserConnected = true;
		useSelect.mockImplementation( () => 123 );
		useDispatch.mockReturnValue( {
			__unstableSaveForPreview: jest.fn().mockResolvedValue( undefined ),
		} );
		window.Jetpack_Editor_Initial_State = { tracksUserData: { email: 'author@example.com' } };
	} );

	afterEach( () => {
		delete window.Jetpack_Editor_Initial_State;
	} );

	it( 'prefills the recipient field with the current user email', () => {
		render( <NewsletterTestEmailModal isOpen onClose={ jest.fn() } /> );

		expect( screen.getByRole( 'textbox' ) ).toHaveValue( 'author@example.com' );
	} );

	it( 'sends to an edited recipient address', async () => {
		const user = userEvent.setup();
		apiFetch.mockResolvedValue( undefined );

		render( <NewsletterTestEmailModal isOpen onClose={ jest.fn() } /> );

		const field = screen.getByRole( 'textbox' );
		await user.clear( field );
		await user.type( field, 'friend@example.com' );
		await user.click( screen.getByRole( 'button', { name: /Send/ } ) );

		expect( apiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				path: '/wpcom/v2/send-email-preview/',
				method: 'POST',
				data: { id: 123, email: 'friend@example.com' },
			} )
		);
	} );

	it( 'sends the test email when pressing Enter in the recipient field', async () => {
		const user = userEvent.setup();
		apiFetch.mockResolvedValue( undefined );

		render( <NewsletterTestEmailModal isOpen onClose={ jest.fn() } /> );

		const field = screen.getByRole( 'textbox' );
		await user.clear( field );
		// The trailing {Enter} submits the surrounding form rather than clicking Send.
		await user.type( field, 'friend@example.com{Enter}' );

		expect( apiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				path: '/wpcom/v2/send-email-preview/',
				method: 'POST',
				data: { id: 123, email: 'friend@example.com' },
			} )
		);
	} );

	it( 'sends to the prefilled address unchanged and confirms success', async () => {
		const user = userEvent.setup();
		apiFetch.mockResolvedValue( undefined );

		render( <NewsletterTestEmailModal isOpen onClose={ jest.fn() } /> );

		await user.click( screen.getByRole( 'button', { name: /Send/ } ) );

		expect( apiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( { data: { id: 123, email: 'author@example.com' } } )
		);
		await expect( screen.findByText( 'Email sent successfully' ) ).resolves.toBeInTheDocument();
	} );

	it( 'trims surrounding whitespace from the recipient before sending', async () => {
		const user = userEvent.setup();
		apiFetch.mockResolvedValue( undefined );

		render( <NewsletterTestEmailModal isOpen onClose={ jest.fn() } /> );

		const field = screen.getByRole( 'textbox' );
		await user.clear( field );
		await user.type( field, '  spaced@example.com  ' );
		await user.click( screen.getByRole( 'button', { name: /Send/ } ) );

		expect( apiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( { data: { id: 123, email: 'spaced@example.com' } } )
		);
	} );

	it( 'sends an empty recipient when the field is cleared, letting the server fall back to self', async () => {
		const user = userEvent.setup();
		apiFetch.mockResolvedValue( undefined );

		render( <NewsletterTestEmailModal isOpen onClose={ jest.fn() } /> );

		await user.clear( screen.getByRole( 'textbox' ) );
		await user.click( screen.getByRole( 'button', { name: /Send/ } ) );

		expect( apiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( { data: { id: 123, email: '' } } )
		);
	} );

	it( 'disables the recipient field while a send is in flight', async () => {
		const user = userEvent.setup();
		let resolveSend;
		apiFetch.mockReturnValue(
			new Promise( resolve => {
				resolveSend = resolve;
			} )
		);

		render( <NewsletterTestEmailModal isOpen onClose={ jest.fn() } /> );

		const field = screen.getByRole( 'textbox' );
		await user.click( screen.getByRole( 'button', { name: /Send/ } ) );

		await waitFor( () => expect( field ).toBeDisabled() );

		// Let the in-flight request settle so the final state update is flushed.
		resolveSend();
		await expect( screen.findByText( 'Email sent successfully' ) ).resolves.toBeInTheDocument();
	} );

	it( 'surfaces the guard message when a non-self recipient is rejected', async () => {
		const user = userEvent.setup();
		apiFetch.mockRejectedValue( {
			code: 'send_email_preview_forbidden_recipient',
			message: 'You are not allowed to send a test email to another address on this site.',
		} );

		render( <NewsletterTestEmailModal isOpen onClose={ jest.fn() } /> );

		await user.click( screen.getByRole( 'button', { name: /Send/ } ) );

		await expect(
			screen.findByText( /not allowed to send a test email/, IGNORE_LIVE_REGION )
		).resolves.toBeInTheDocument();
	} );

	it( 'renders send errors in an error notice rather than plain text', async () => {
		const user = userEvent.setup();
		apiFetch.mockRejectedValue( { code: 'rest_something_else', message: 'Boom' } );

		render( <NewsletterTestEmailModal isOpen onClose={ jest.fn() } /> );

		await user.click( screen.getByRole( 'button', { name: /Send/ } ) );

		// The message must live inside a Notice styled as an error, not a bare <p>.
		const message = await screen.findByText( /Boom/, IGNORE_LIVE_REGION );
		// eslint-disable-next-line testing-library/no-node-access
		expect( message.closest( '.components-notice' ) ).toHaveClass( 'is-error' );
	} );

	it( 'rejects a malformed address client-side without calling the API', async () => {
		const user = userEvent.setup();
		apiFetch.mockResolvedValue( undefined );

		render( <NewsletterTestEmailModal isOpen onClose={ jest.fn() } /> );

		const field = screen.getByRole( 'textbox' );
		await user.clear( field );
		await user.type( field, 'not-an-email' );
		await user.click( screen.getByRole( 'button', { name: /Send/ } ) );

		await expect(
			screen.findByText( /please enter a valid email address/i, IGNORE_LIVE_REGION )
		).resolves.toBeInTheDocument();
		expect( apiFetch ).not.toHaveBeenCalled();
	} );

	it( 'shows a friendly fallback when the response has no error code', async () => {
		const user = userEvent.setup();
		apiFetch.mockRejectedValue( { message: 'The response is not a valid JSON response.' } );

		render( <NewsletterTestEmailModal isOpen onClose={ jest.fn() } /> );

		await user.click( screen.getByRole( 'button', { name: /Send/ } ) );

		await expect(
			screen.findByText( /please try again in a little while/i, IGNORE_LIVE_REGION )
		).resolves.toBeInTheDocument();
		expect( screen.queryByText( /not a valid JSON response/i ) ).not.toBeInTheDocument();
	} );

	// The Atomic edge rate limiter returns a text/html 429 before WordPress runs,
	// which apiFetch collapses to a non-actionable `invalid_json` code (the 429
	// status is dropped). The raw parser message must not reach the user.
	it( 'shows a friendly fallback for a non-actionable invalid_json rejection', async () => {
		const user = userEvent.setup();
		apiFetch.mockRejectedValue( {
			code: 'invalid_json',
			message: 'The response is not a valid JSON response.',
		} );

		render( <NewsletterTestEmailModal isOpen onClose={ jest.fn() } /> );

		await user.click( screen.getByRole( 'button', { name: /Send/ } ) );

		await expect(
			screen.findByText( /please try again in a little while/i, IGNORE_LIVE_REGION )
		).resolves.toBeInTheDocument();
		expect( screen.queryByText( /not a valid JSON response/i ) ).not.toBeInTheDocument();
	} );

	it( 'locks the recipient field for users who cannot send to others', () => {
		window.Jetpack_Editor_Initial_State.jetpack = { can_send_test_email_to_others: false };

		render( <NewsletterTestEmailModal isOpen onClose={ jest.fn() } /> );

		expect( screen.getByRole( 'textbox' ) ).toBeDisabled();
	} );
} );
