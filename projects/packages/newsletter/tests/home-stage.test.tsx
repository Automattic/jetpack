// Two contracts on the Newsletter Mode Dashboard route.
//
// The greeting. The name is resolved server side (`Mode::get_greeting_name()` —
// nickname, else first name, else empty); the route only decides what to do
// with the result:
//
// 1. a name renders as "Welcome, <name>".
// 2. an empty name — the profile has neither a nickname nor a first name —
//    falls back to "Hey there" rather than a dangling "Welcome, ".
// 3. so does a missing `greetingName` altogether, which is what every surface
//    outside the mode's own pages sees, since `Mode::maybe_add_script_data()`
//    is the only thing that sets it.
//
// The links out of the page. Three go to Add Subscribers — the "Bring your
// contacts" and "Invite by email" tiles, and the "Grow your audience"
// checklist row — and one, "Write your first post", goes wherever the nav's
// Write button goes:
//
// 4. each Add Subscribers link deep-links to the tab its copy promised — CSV
//    upload for the import tile, the manual address list for the other two.
//    Links, not a modal rendered here, so this route doesn't carry the import
//    stack (see `getAddSubscribersUrl()`).
// 5. "Write your first post" uses the server-resolved `writeUrl`, the same
//    value `Mode::get_write_url()` gives the nav button, so the two can't drift.
// 6. nothing else on the page is a link — an entry point with no destination
//    must not advertise an affordance it doesn't have.
// 6a. "Set up paid subscriptions" leaves wp-admin for the WordPress.com Earn
//    screen — the same `monetizeUrl` the nav's Monetize item opens — so it is
//    the one checklist row that opens in a new tab, `rel` and all.
// 7. the Add Subscribers links go inert when the site can't manage subscribers,
//    rather than pointing at a page that would only refuse. That gate mirrors
//    the one the Subscribers page applies: Simple sites always pass; everywhere
//    else needs a registered site, a connected owner, and a connected user.
//    Writing a post needs no connection, so that link is never gated.

const mockGetNewsletterScriptData = jest.fn<
	| {
			greetingName?: string;
			writeUrl?: string;
			siteUrl?: string;
			settingsUrl?: string;
			checklistDismissed?: boolean;
			monetizeUrl?: string;
	  }
	| undefined,
	[]
>();
const mockShareModalProps = jest.fn();
const mockIsSimpleSite = jest.fn< boolean, [] >();
const mockConnection = jest.fn< Record< string, unknown >, [] >();
const mockApiFetch = jest.fn< Promise< unknown >, unknown[] >();

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getSiteData: () => ( {
		rest_root: 'https://example.com/wp-json/',
		rest_nonce: 'test-nonce',
	} ),
	getAdminUrl: ( path: string ) => `https://example.com/wp-admin/${ path }`,
	isSimpleSite: () => mockIsSimpleSite(),
} ) );

jest.mock( '@automattic/jetpack-connection/use-connection', () => ( {
	__esModule: true,
	default: () => mockConnection(),
} ) );

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

jest.mock( '../src/settings/script-data', () => ( {
	getNewsletterModeScriptData: () => mockGetNewsletterScriptData(),
} ) );

// `AdminPage` owns the Jetpack header and footer; the greeting lives in the
// body, so render the children straight through.
jest.mock( '@automattic/jetpack-components/admin-page', () => ( {
	__esModule: true,
	default: ( { children } ) => <div data-testid="admin-page">{ children }</div>,
} ) );

// The Share modal has its own coverage; here we only care that the route mounts
// it with the URL to share.
jest.mock( '../_inc/share/share-newsletter-modal', () => ( {
	__esModule: true,
	default: props => {
		mockShareModalProps( props );
		return <div data-testid="share-modal" />;
	},
} ) );

import { act, render, screen } from '@testing-library/react';
import { stage as Stage } from '../routes/home/stage';

const CONNECTED = {
	isRegistered: true,
	hasConnectedOwner: true,
	isUserConnected: true,
};

const SUBSCRIBERS_PAGE = 'https://example.com/wp-admin/admin.php?page=jetpack-newsletter';
const WRITE_URL = 'https://example.com/wp-admin/post-new.php?source=newsletter';
const SITE_URL = 'https://octagonal.example.com';
const MONETIZE_URL = 'https://wordpress.com/earn/octagonal.example.com';
const SETTINGS_URL =
	'https://example.com/wp-admin/admin.php?page=jetpack-newsletter&p=%2F%3Ftab%3Dsettings';

/**
 * Click a button by its accessible name — a native click, the way the sibling
 * suites do, since this package doesn't pull in `@testing-library/user-event`.
 * Wrapped in `act` because these clicks drive React state.
 *
 * @param label - Text the target button's accessible name contains.
 */
function clickButton( label: string ): void {
	const button = screen.getByRole( 'button', { name: new RegExp( label ) } );

	act( () => button.click() );
}

beforeEach( () => {
	mockGetNewsletterScriptData.mockReset();
	mockGetNewsletterScriptData.mockReturnValue( {
		greetingName: '',
		writeUrl: WRITE_URL,
		siteUrl: SITE_URL,
		settingsUrl: SETTINGS_URL,
		monetizeUrl: MONETIZE_URL,
	} );
	mockShareModalProps.mockReset();
	mockIsSimpleSite.mockReturnValue( true );
	mockConnection.mockReturnValue( CONNECTED );
	mockApiFetch.mockReset();
	mockApiFetch.mockResolvedValue( { dismissed: true } );
} );

describe( 'Newsletter Mode dashboard greeting', () => {
	it( 'greets the user by the name the server resolved', () => {
		mockGetNewsletterScriptData.mockReturnValue( { greetingName: 'Zara' } );

		render( <Stage /> );

		expect( screen.getByRole( 'heading', { level: 1 } ) ).toHaveTextContent( 'Welcome, Zara' );
	} );

	it( 'falls back to a name-less greeting when the profile has neither', () => {
		mockGetNewsletterScriptData.mockReturnValue( { greetingName: '' } );

		render( <Stage /> );

		expect( screen.getByRole( 'heading', { level: 1 } ) ).toHaveTextContent( 'Hey there' );
	} );

	it( 'falls back when the script data carries no greeting at all', () => {
		mockGetNewsletterScriptData.mockReturnValue( undefined );

		render( <Stage /> );

		expect( screen.getByRole( 'heading', { level: 1 } ) ).toHaveTextContent( 'Hey there' );
	} );
} );

describe( 'Newsletter Mode dashboard links', () => {
	it( 'makes links of exactly the entry points that have a destination', () => {
		render( <Stage /> );

		expect( screen.getAllByRole( 'link' ).map( anchor => anchor.textContent ) ).toEqual( [
			expect.stringContaining( 'Bring your contacts' ),
			expect.stringContaining( 'Invite by email' ),
			// Not an entry point — the site's own address, inside the first
			// checklist row's sentence.
			'octagonal.example.com',
			expect.stringContaining( 'Make it yours' ),
			expect.stringContaining( 'Write your first post' ),
			expect.stringContaining( 'Grow your audience' ),
			expect.stringContaining( 'Set up paid subscriptions' ),
		] );
	} );

	it( '"Set up paid subscriptions" opens the Earn screen in a new tab', () => {
		render( <Stage /> );

		const link = screen.getByRole( 'link', { name: /Set up paid subscriptions/ } );

		expect( link ).toHaveAttribute( 'href', MONETIZE_URL );
		expect( link ).toHaveAttribute( 'target', '_blank' );
		// Without this the opened page could reach back through `window.opener`.
		expect( link ).toHaveAttribute( 'rel', 'noopener noreferrer' );
	} );

	it( 'leaves the internal checklist links in the same tab', () => {
		render( <Stage /> );

		expect( screen.getByRole( 'link', { name: /Make it yours/ } ) ).not.toHaveAttribute( 'target' );
	} );

	it( 'links the first checklist row to the newsletter address, shown as a bare host', () => {
		render( <Stage /> );

		expect( screen.getByRole( 'link', { name: 'octagonal.example.com' } ) ).toHaveAttribute(
			'href',
			SITE_URL
		);
	} );

	it( 'names no address when the server sent no site URL', () => {
		mockGetNewsletterScriptData.mockReturnValue( {
			greetingName: '',
			writeUrl: WRITE_URL,
			settingsUrl: SETTINGS_URL,
		} );

		render( <Stage /> );

		expect( screen.getByText( 'Your newsletter is ready to share.' ) ).toBeInTheDocument();
		expect(
			screen.queryByRole( 'link', { name: 'octagonal.example.com' } )
		).not.toBeInTheDocument();
	} );

	it.each( [
		[ 'Bring your contacts', 'upload' ],
		[ 'Invite by email', 'manual' ],
		[ 'Grow your audience', 'manual' ],
	] )( '"%s" deep-links to the %s tab', ( label, tab ) => {
		render( <Stage /> );

		expect( screen.getByRole( 'link', { name: new RegExp( label ) } ) ).toHaveAttribute(
			'href',
			`${ SUBSCRIBERS_PAGE }#add-subscribers=${ tab }`
		);
	} );

	it( '"Make it yours" goes to the Settings tab, where the identity section lives', () => {
		render( <Stage /> );

		expect( screen.getByRole( 'link', { name: /Make it yours/ } ) ).toHaveAttribute(
			'href',
			SETTINGS_URL
		);
	} );

	it( '"Write your first post" goes where the nav Write button goes', () => {
		render( <Stage /> );

		expect( screen.getByRole( 'link', { name: /Write your first post/ } ) ).toHaveAttribute(
			'href',
			WRITE_URL
		);
	} );

	it( 'leaves the write task inert when the server sent no write URL', () => {
		mockGetNewsletterScriptData.mockReturnValue( { greetingName: '' } );

		render( <Stage /> );

		expect(
			screen.queryByRole( 'link', { name: /Write your first post/ } )
		).not.toBeInTheDocument();
	} );

	it( 'leaves the subscriber links inert when the site cannot manage subscribers', () => {
		mockIsSimpleSite.mockReturnValue( false );
		mockConnection.mockReturnValue( { ...CONNECTED, isUserConnected: false } );

		render( <Stage /> );

		// Neither the settings nor the write task is gated on the connection, so
		// both survive.
		expect( screen.getAllByRole( 'link' ).map( anchor => anchor.textContent ) ).toEqual( [
			// These are gated on their own URLs, not on the connection.
			'octagonal.example.com',
			expect.stringContaining( 'Make it yours' ),
			expect.stringContaining( 'Write your first post' ),
			expect.stringContaining( 'Set up paid subscriptions' ),
		] );
	} );

	it( 'keeps them live on a Simple site, which never carries a connection', () => {
		mockIsSimpleSite.mockReturnValue( true );
		mockConnection.mockReturnValue( {
			isRegistered: false,
			hasConnectedOwner: false,
			isUserConnected: false,
		} );

		render( <Stage /> );

		// Six entry points plus the site address in the first checklist row.
		expect( screen.getAllByRole( 'link' ) ).toHaveLength( 7 );
	} );
} );

describe( 'Newsletter Mode dashboard Share entry points', () => {
	it( 'makes a button of the one share entry point', () => {
		render( <Stage /> );

		expect( screen.getAllByRole( 'button' ).map( button => button.textContent ) ).toEqual( [
			expect.stringContaining( 'Share your link' ),
			// Not a share entry point — the checklist's own Dismiss control.
			'Dismiss',
		] );
	} );

	it( 'stays unmounted until a share entry point is clicked', () => {
		render( <Stage /> );

		expect( screen.queryByTestId( 'share-modal' ) ).not.toBeInTheDocument();
	} );

	it.each( [ 'Share your link' ] )( '"%s" opens the Share modal with the site URL', label => {
		render( <Stage /> );

		clickButton( label );

		expect( screen.getByTestId( 'share-modal' ) ).toBeInTheDocument();
		expect( mockShareModalProps ).toHaveBeenCalledWith(
			expect.objectContaining( { siteUrl: SITE_URL } )
		);
	} );

	it( 'leaves them inert when the server sent no site URL', () => {
		mockGetNewsletterScriptData.mockReturnValue( { greetingName: '', writeUrl: WRITE_URL } );

		render( <Stage /> );

		// Only the checklist's Dismiss remains — neither share entry point has a
		// URL to hand out, so neither renders a control.
		expect( screen.queryAllByRole( 'button' ).map( button => button.textContent ) ).toEqual( [
			'Dismiss',
		] );
	} );
} );

describe( 'Newsletter Mode dashboard checklist dismissal', () => {
	// Dismissal is per user and persisted server side, so the state arrives in
	// script data. The route hides the checklist optimistically and puts it back
	// if the write fails, rather than leaving the page disagreeing with what the
	// next load will render.
	it( 'shows the checklist under its heading by default', () => {
		render( <Stage /> );

		expect( screen.getByRole( 'heading', { name: 'Getting started' } ) ).toBeInTheDocument();
		expect( screen.getByText( 'Make it yours' ) ).toBeInTheDocument();
	} );

	it( 'renders without the checklist when the server says this user dismissed it', () => {
		mockGetNewsletterScriptData.mockReturnValue( {
			greetingName: '',
			writeUrl: WRITE_URL,
			siteUrl: SITE_URL,
			settingsUrl: SETTINGS_URL,
			checklistDismissed: true,
		} );

		render( <Stage /> );

		expect( screen.queryByRole( 'heading', { name: 'Getting started' } ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Make it yours' ) ).not.toBeInTheDocument();
	} );

	it( 'hides the checklist and persists the dismissal when Dismiss is clicked', () => {
		render( <Stage /> );

		clickButton( 'Dismiss' );

		expect( screen.queryByRole( 'heading', { name: 'Getting started' } ) ).not.toBeInTheDocument();
		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/jetpack-newsletter/v1/checklist-dismissed',
			method: 'POST',
			data: { dismissed: true },
		} );
	} );

	it( 'brings the checklist back when the write fails', async () => {
		mockApiFetch.mockRejectedValue( new Error( 'nope' ) );

		render( <Stage /> );

		clickButton( 'Dismiss' );

		// `find*` retries, so it settles the rejected write and then sees the
		// checklist restored.
		await expect(
			screen.findByRole( 'heading', { name: 'Getting started' } )
		).resolves.toBeInTheDocument();
	} );
} );
