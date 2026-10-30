import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { select, useSelect, useDispatch } from '@wordpress/data';
import { useState } from 'react';
import { NewsletterTestEmailModal, NewsletterPreviewModal } from '../email-preview';

jest.mock( '@wordpress/api-fetch' );

// Controls what `useConnection()` reports; toggled per test.
let mockIsUserConnected = true;

jest.mock( '@automattic/jetpack-connection', () => ( {
	getUserConnectionUrl: () => 'https://example.com/connect',
	useConnection: () => ( { isUserConnected: mockIsUserConnected } ),
} ) );

// Treat the site as self-hosted so the connection gate applies. `getScriptData` answers the
// email design screen's URL; `mockEmailDesignUrl` is what each test varies.
let mockEmailDesignUrl: string | null = null;

// Mirrors `useViewportMatch`'s own breakpoints and operators, so a test sets a viewport width
// rather than booleans that could describe a width no browser can produce. `<` is `max-width`,
// so it matches *at* the breakpoint -- the hook's simulated-width path is strict, but nothing
// in the monorepo provides one.
const mockBreakpoints = {
	xhuge: 1920,
	huge: 1440,
	wide: 1280,
	xlarge: 1080,
	large: 960,
	medium: 782,
	small: 600,
	mobile: 480,
};
let mockViewportWidth = 1280;

jest.mock( '@wordpress/compose', () => ( {
	...jest.requireActual( '@wordpress/compose' ),
	useViewportMatch: ( breakpoint: string, operator = '>=' ) =>
		operator === '<'
			? mockViewportWidth <= mockBreakpoints[ breakpoint ]
			: mockViewportWidth >= mockBreakpoints[ breakpoint ],
} ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	isSimpleSite: () => false,
	getScriptData: () => ( { newsletter: { emailDesignUrl: mockEmailDesignUrl } } ),
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
	// Renders its children, so the accessible name still includes the hidden label.
	VisuallyHidden: ( { children } ) => <span data-testid="visually-hidden">{ children }</span>,
	Link: ( { children, href, openInNewTab, onClick, 'aria-label': ariaLabel, className } ) => (
		<a
			href={ href }
			target={ openInNewTab ? '_blank' : undefined }
			rel={ openInNewTab ? 'noreferrer' : undefined }
			onClick={ onClick }
			aria-label={ ariaLabel }
			className={ className }
		>
			{ children }
		</a>
	),
} ) );

// `@wordpress/editor` registers rich-text formats at import time against the real data registry.
jest.mock( '@wordpress/editor', () => ( { store: 'core/editor' } ) );

// The access toggle reads the post's meta through this, and no test varies the access level.
jest.mock( '@wordpress/core-data', () => ( { useEntityProp: () => [ undefined, jest.fn() ] } ) );

jest.mock( '@wordpress/data', () => {
	const actual = jest.requireActual( '@wordpress/data' );
	const mocks = {
		useSelect: jest.fn(),
		useDispatch: jest.fn(),
		select: jest.fn(),
	};
	return new Proxy( actual, {
		get( target, property ) {
			return mocks[ property ] ?? target[ property ];
		},
	} );
} );

let mockIsPostDirty = false;

const mockEditorSelectors = {
	getCurrentPostId: () => 123,
	getCurrentPostType: () => 'post',
	isEditedPostDirty: () => mockIsPostDirty,
};

/**
 * Point both `select` and `useSelect` at the editor-store stub, with a saved post.
 */
function mockEditorStore() {
	mockIsPostDirty = false;
	( useSelect as jest.Mock ).mockImplementation( ( mapSelect: ( s: unknown ) => unknown ) =>
		mapSelect( () => mockEditorSelectors )
	);
	( select as jest.Mock ).mockReturnValue( mockEditorSelectors );
}

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
		mockEditorStore();
		jest.mocked( useDispatch ).mockReturnValue( {
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
		jest.mocked( apiFetch ).mockRejectedValue( MISSING_CONNECTION_ERROR );

		render( <NewsletterTestEmailModal isOpen onClose={ jest.fn() } /> );

		await user.click( screen.getByRole( 'button', { name: /Send/ } ) );

		const connectLink = await screen.findByRole( 'link', { name: 'Connect your account' } );
		expect( connectLink ).toHaveAttribute( 'href', 'https://example.com/connect' );
	} );

	it( 'surfaces the raw message for non-connection send errors', async () => {
		const user = userEvent.setup();
		jest.mocked( apiFetch ).mockRejectedValue( { code: 'rest_something_else', message: 'Boom' } );

		render( <NewsletterTestEmailModal isOpen onClose={ jest.fn() } /> );

		await user.click( screen.getByRole( 'button', { name: /Send/ } ) );

		await expect( screen.findByText( /Boom/, IGNORE_LIVE_REGION ) ).resolves.toBeInTheDocument();
		expect(
			screen.queryByRole( 'link', { name: 'Connect your account' } )
		).not.toBeInTheDocument();
	} );

	it( 'prompts the user to connect when the HTML preview fails with a missing connection', async () => {
		jest.mocked( apiFetch ).mockRejectedValue( MISSING_CONNECTION_ERROR );

		render( <NewsletterPreviewModal isOpen postId={ 123 } onClose={ jest.fn() } /> );

		const connectLink = await screen.findByRole( 'link', { name: 'Connect your account' } );
		expect( connectLink ).toHaveAttribute( 'href', 'https://example.com/connect' );
	} );

	it( 'shows the generic error (with retry) for non-connection preview errors', async () => {
		jest.mocked( apiFetch ).mockRejectedValue( { code: 'rest_something_else', message: 'Boom' } );

		render( <NewsletterPreviewModal isOpen postId={ 123 } onClose={ jest.fn() } /> );

		await expect(
			screen.findByRole( 'button', { name: 'Try again' } )
		).resolves.toBeInTheDocument();
		expect(
			screen.queryByRole( 'link', { name: 'Connect your account' } )
		).not.toBeInTheDocument();
	} );
} );

/**
 * Owns `isOpen` the way the editor does, so dismissing flips it in the same commit that clears
 * the preview cache -- leaving it open makes the refetch depend on React's flush timing.
 *
 * @return The modal, open, with a control to reopen it.
 */
function PreviewModalHarness() {
	const [ isOpen, setIsOpen ] = useState( true );
	return (
		<>
			<button onClick={ () => setIsOpen( true ) }>Reopen</button>
			<NewsletterPreviewModal
				isOpen={ isOpen }
				postId={ 123 }
				onClose={ () => setIsOpen( false ) }
			/>
		</>
	);
}

describe( 'Newsletter preview: save before fetching', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockIsUserConnected = true;
		mockEditorStore();
	} );

	it( 'saves the dirty post before fetching the preview', async () => {
		const saveForPreview = jest.fn().mockResolvedValue( undefined );
		jest.mocked( useDispatch ).mockReturnValue( { __unstableSaveForPreview: saveForPreview } );
		mockIsPostDirty = true;
		jest.mocked( apiFetch ).mockResolvedValue( { html: '<p>Preview</p>' } );

		render( <NewsletterPreviewModal isOpen postId={ 123 } onClose={ jest.fn() } /> );

		// The save is kicked off synchronously within the effect, before the fetch.
		expect( saveForPreview ).toHaveBeenCalledTimes( 1 );
		expect( apiFetch ).not.toHaveBeenCalled();

		await waitFor( () => expect( apiFetch ).toHaveBeenCalledTimes( 1 ) );
	} );

	it( 'renders the preview inside a sandboxed iframe with no script execution', async () => {
		jest.mocked( useDispatch ).mockReturnValue( {
			__unstableSaveForPreview: jest.fn().mockResolvedValue( undefined ),
		} );
		jest.mocked( apiFetch ).mockResolvedValue( { html: '<p>Preview</p>' } );

		render( <NewsletterPreviewModal isOpen postId={ 123 } onClose={ jest.fn() } /> );

		const iframe = await screen.findByTitle( 'Email Preview' );
		// An empty sandbox strips script execution and same-origin access, so any
		// markup in the returned HTML stays inert regardless of upstream escaping.
		expect( iframe ).toHaveAttribute( 'sandbox', '' );
	} );

	it( 'skips the save and fetches directly when the post is not dirty', async () => {
		const saveForPreview = jest.fn().mockResolvedValue( undefined );
		jest.mocked( useDispatch ).mockReturnValue( { __unstableSaveForPreview: saveForPreview } );
		jest.mocked( apiFetch ).mockResolvedValue( { html: '<p>Preview</p>' } );

		render( <NewsletterPreviewModal isOpen postId={ 123 } onClose={ jest.fn() } /> );

		await waitFor( () => expect( apiFetch ).toHaveBeenCalledTimes( 1 ) );
		expect( saveForPreview ).not.toHaveBeenCalled();
	} );

	it( 're-saves after the modal is dismissed (clearing the cache) and reopened', async () => {
		const user = userEvent.setup();
		const saveForPreview = jest.fn().mockResolvedValue( undefined );
		jest.mocked( useDispatch ).mockReturnValue( { __unstableSaveForPreview: saveForPreview } );
		mockIsPostDirty = true;
		jest.mocked( apiFetch ).mockResolvedValue( { html: '<p>Preview</p>' } );

		render( <PreviewModalHarness /> );
		await waitFor( () => expect( apiFetch ).toHaveBeenCalledTimes( 1 ) );
		expect( saveForPreview ).toHaveBeenCalledTimes( 1 );

		await user.click( screen.getByRole( 'button', { name: /close/i } ) );
		// The modal hides the rest of the document while open, so finding Reopen means it closed.
		await user.click( await screen.findByRole( 'button', { name: 'Reopen' } ) );

		await waitFor( () => expect( saveForPreview ).toHaveBeenCalledTimes( 2 ) );
		expect( apiFetch ).toHaveBeenCalledTimes( 2 );
	} );
} );

describe( 'Test email recipient', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockIsUserConnected = true;
		mockEditorStore();
		jest.mocked( useDispatch ).mockReturnValue( {
			__unstableSaveForPreview: jest.fn().mockResolvedValue( undefined ),
		} );
		window.Jetpack_Editor_Initial_State = {
			tracksUserData: { userid: '1', username: 'author', email: 'author@example.com' },
		} as unknown as typeof window.Jetpack_Editor_Initial_State;
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
		jest.mocked( apiFetch ).mockResolvedValue( undefined );

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
		jest.mocked( apiFetch ).mockResolvedValue( undefined );

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
		jest.mocked( apiFetch ).mockResolvedValue( undefined );

		render( <NewsletterTestEmailModal isOpen onClose={ jest.fn() } /> );

		await user.click( screen.getByRole( 'button', { name: /Send/ } ) );

		expect( apiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( { data: { id: 123, email: 'author@example.com' } } )
		);
		await expect( screen.findByText( 'Email sent successfully' ) ).resolves.toBeInTheDocument();
	} );

	it( 'trims surrounding whitespace from the recipient before sending', async () => {
		const user = userEvent.setup();
		jest.mocked( apiFetch ).mockResolvedValue( undefined );

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
		jest.mocked( apiFetch ).mockResolvedValue( undefined );

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
		jest.mocked( apiFetch ).mockReturnValue(
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
		jest.mocked( apiFetch ).mockRejectedValue( {
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
		jest.mocked( apiFetch ).mockRejectedValue( { code: 'rest_something_else', message: 'Boom' } );

		render( <NewsletterTestEmailModal isOpen onClose={ jest.fn() } /> );

		await user.click( screen.getByRole( 'button', { name: /Send/ } ) );

		// The message must live inside a Notice styled as an error, not a bare <p>.
		const message = await screen.findByText( /Boom/, IGNORE_LIVE_REGION );
		// eslint-disable-next-line testing-library/no-node-access
		expect( message.closest( '.components-notice' ) ).toHaveClass( 'is-error' );
	} );

	it( 'rejects a malformed address client-side without calling the API', async () => {
		const user = userEvent.setup();
		jest.mocked( apiFetch ).mockResolvedValue( undefined );

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
		jest
			.mocked( apiFetch )
			.mockRejectedValue( { message: 'The response is not a valid JSON response.' } );

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
		jest.mocked( apiFetch ).mockRejectedValue( {
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

describe( 'Newsletter preview: email design link', () => {
	const DESIGN_URL = 'https://example.com/wp-admin/themes.php?page=jetpack-email-design';

	beforeEach( () => {
		jest.clearAllMocks();
		mockIsUserConnected = true;
		mockEmailDesignUrl = null;
		mockViewportWidth = 1280;
		mockEditorStore();
		jest.mocked( useDispatch ).mockReturnValue( {
			__unstableSaveForPreview: jest.fn().mockResolvedValue( undefined ),
		} );
		jest.mocked( apiFetch ).mockResolvedValue( { html: '<p>Preview</p>' } );
	} );

	it( 'offers no link on a site with no email design screen', async () => {
		render( <NewsletterPreviewModal isOpen postId={ 123 } onClose={ jest.fn() } /> );
		await waitFor( () => expect( apiFetch ).toHaveBeenCalled() );

		expect( screen.queryByRole( 'link', { name: 'Edit email design' } ) ).not.toBeInTheDocument();
	} );

	it( 'sends a saved post to the design screen in this tab, with a way back to it', async () => {
		mockEmailDesignUrl = DESIGN_URL;

		render( <NewsletterPreviewModal isOpen postId={ 123 } onClose={ jest.fn() } /> );
		const link = await screen.findByRole( 'link', { name: 'Edit email design' } );
		await waitFor( () => expect( apiFetch ).toHaveBeenCalled() );

		// The post travels so the design canvas previews it rather than the sample post. NL-1051.
		expect( link ).toHaveAttribute(
			'href',
			`${ DESIGN_URL }&post_id=123&return=${ encodeURIComponent(
				window.location.href
			) }&source=preview_modal`
		);
		expect( link ).not.toHaveAttribute( 'target' );
	} );

	it( 'keeps the new tab, and sends no way back, while the post holds unsaved edits', async () => {
		mockEmailDesignUrl = DESIGN_URL;
		// An already-published post is still dirty after the modal's save.
		mockIsPostDirty = true;

		render( <NewsletterPreviewModal isOpen postId={ 123 } onClose={ jest.fn() } /> );
		const link = await screen.findByRole( 'link', { name: 'Edit email design' } );
		await waitFor( () => expect( apiFetch ).toHaveBeenCalled() );

		expect( link ).toHaveAttribute( 'href', `${ DESIGN_URL }&post_id=123&source=preview_modal` );
		expect( link ).toHaveAttribute( 'target', '_blank' );
	} );

	it( 'names no post before the one being previewed has an id', async () => {
		mockEmailDesignUrl = DESIGN_URL;

		render( <NewsletterPreviewModal isOpen postId={ 0 } onClose={ jest.fn() } /> );
		const link = await screen.findByRole( 'link', { name: 'Edit email design' } );

		expect( link ).toHaveAttribute(
			'href',
			`${ DESIGN_URL }&return=${ encodeURIComponent( window.location.href ) }&source=preview_modal`
		);
	} );

	/**
	 * Both of the other args drop out here, so without the route this link is indistinguishable
	 * from someone opening the screen from the Appearance menu. NL-1088.
	 */
	it( 'still names the route when it has neither a post nor a way back to send', async () => {
		mockEmailDesignUrl = DESIGN_URL;
		mockIsPostDirty = true;

		render( <NewsletterPreviewModal isOpen postId={ 0 } onClose={ jest.fn() } /> );
		const link = await screen.findByRole( 'link', { name: 'Edit email design' } );

		expect( link ).toHaveAttribute( 'href', `${ DESIGN_URL }&source=preview_modal` );
	} );

	it( 'drops to an icon where the header runs out of room', async () => {
		mockEmailDesignUrl = DESIGN_URL;
		mockViewportWidth = 900;

		render( <NewsletterPreviewModal isOpen postId={ 123 } onClose={ jest.fn() } /> );
		const link = await screen.findByRole( 'link', { name: 'Edit email design' } );
		await waitFor( () => expect( apiFetch ).toHaveBeenCalled() );

		// The label is still the link's name, it is just not on screen beside the icon.
		expect( screen.getByTestId( 'visually-hidden' ) ).toHaveTextContent( 'Edit email design' );
		// An `aria-label` would override the contents and discard `Link`'s own new-tab notice.
		expect( link ).not.toHaveAttribute( 'aria-label' );
	} );

	it( 'keeps the label beside the icon where there is room', async () => {
		mockEmailDesignUrl = DESIGN_URL;

		render( <NewsletterPreviewModal isOpen postId={ 123 } onClose={ jest.fn() } /> );
		const link = await screen.findByRole( 'link', { name: 'Edit email design' } );
		await waitFor( () => expect( apiFetch ).toHaveBeenCalled() );

		expect( link ).toHaveTextContent( 'Edit email design' );
		expect( screen.queryByTestId( 'visually-hidden' ) ).not.toBeInTheDocument();
	} );
} );

describe( 'Newsletter preview: device selector', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockIsUserConnected = true;
		mockEmailDesignUrl = null;
		mockViewportWidth = 1280;
		mockEditorStore();
		jest.mocked( useDispatch ).mockReturnValue( {
			__unstableSaveForPreview: jest.fn().mockResolvedValue( undefined ),
		} );
		jest.mocked( apiFetch ).mockResolvedValue( { html: '<p>Preview</p>' } );
	} );

	it.each( [
		[ 1280, '100%' ],
		[ 900, '768px' ],
	] )( 'previews at the widest offered device: %ipx renders %s', async ( width, expected ) => {
		mockViewportWidth = width as number;

		render( <NewsletterPreviewModal isOpen postId={ 123 } onClose={ jest.fn() } /> );

		await expect( screen.findByTitle( 'Email Preview' ) ).resolves.toHaveStyle( {
			width: expected,
		} );
	} );

	it( 'selects the fallback device in the control where desktop is not offered', async () => {
		mockViewportWidth = 900;

		render( <NewsletterPreviewModal isOpen postId={ 123 } onClose={ jest.fn() } /> );
		await waitFor( () => expect( apiFetch ).toHaveBeenCalled() );

		expect( screen.queryByRole( 'radio', { name: 'Desktop' } ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'radio', { name: 'Tablet' } ) ).toBeChecked();
	} );

	it( 'previews at desktop width again once the viewport can offer it', async () => {
		mockViewportWidth = 900;

		const { rerender } = render(
			<NewsletterPreviewModal isOpen postId={ 123 } onClose={ jest.fn() } />
		);
		const iframe = await screen.findByTitle( 'Email Preview' );

		mockViewportWidth = 1280;
		rerender( <NewsletterPreviewModal isOpen postId={ 123 } onClose={ jest.fn() } /> );
		await expect( screen.findByRole( 'radio', { name: 'Desktop' } ) ).resolves.toBeInTheDocument();
		expect( iframe ).toHaveStyle( { width: '100%' } );
	} );

	it( 'rebuilds the control when the offered devices change, so its highlight is re-measured', async () => {
		mockViewportWidth = 900;

		const { rerender } = render(
			<NewsletterPreviewModal isOpen postId={ 123 } onClose={ jest.fn() } />
		);
		await waitFor( () => expect( apiFetch ).toHaveBeenCalled() );
		const narrowControl = screen.getByRole( 'radiogroup', { name: 'Preview device' } );

		mockViewportWidth = 1280;
		rerender( <NewsletterPreviewModal isOpen postId={ 123 } onClose={ jest.fn() } /> );

		await expect( screen.findByRole( 'radio', { name: 'Desktop' } ) ).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'radiogroup', { name: 'Preview device' } ) ).not.toBe(
			narrowControl
		);
	} );
} );
