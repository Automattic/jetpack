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
// contacts" and "Invite by email" tiles, and the "Bring your first readers"
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
// 7. the Add Subscribers links go inert when the site can't manage subscribers,
//    rather than pointing at a page that would only refuse. That gate mirrors
//    the one the Subscribers page applies: Simple sites always pass; everywhere
//    else needs a registered site, a connected owner, and a connected user.
//    Writing a post needs no connection, so that link is never gated.

const mockGetNewsletterScriptData = jest.fn<
	{ greetingName?: string; writeUrl?: string; siteUrl?: string } | undefined,
	[]
>();
const mockShareModalProps = jest.fn();
const mockIsSimpleSite = jest.fn< boolean, [] >();
const mockConnection = jest.fn< Record< string, unknown >, [] >();

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
	} );
	mockShareModalProps.mockReset();
	mockIsSimpleSite.mockReturnValue( true );
	mockConnection.mockReturnValue( CONNECTED );
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
			expect.stringContaining( 'Write your first post' ),
			expect.stringContaining( 'Bring your first readers' ),
		] );
	} );

	it.each( [
		[ 'Bring your contacts', 'upload' ],
		[ 'Invite by email', 'manual' ],
		[ 'Bring your first readers', 'manual' ],
	] )( '"%s" deep-links to the %s tab', ( label, tab ) => {
		render( <Stage /> );

		expect( screen.getByRole( 'link', { name: new RegExp( label ) } ) ).toHaveAttribute(
			'href',
			`${ SUBSCRIBERS_PAGE }#add-subscribers=${ tab }`
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

		// The write task is never gated on the connection, so it survives.
		expect( screen.getAllByRole( 'link' ).map( anchor => anchor.textContent ) ).toEqual( [
			expect.stringContaining( 'Write your first post' ),
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

		expect( screen.getAllByRole( 'link' ) ).toHaveLength( 4 );
	} );
} );

describe( 'Newsletter Mode dashboard Share entry points', () => {
	it( 'makes buttons of the two share entry points', () => {
		render( <Stage /> );

		expect( screen.getAllByRole( 'button' ).map( button => button.textContent ) ).toEqual( [
			expect.stringContaining( 'Share your link' ),
			expect.stringContaining( 'Share your newsletter' ),
		] );
	} );

	it( 'stays unmounted until a share entry point is clicked', () => {
		render( <Stage /> );

		expect( screen.queryByTestId( 'share-modal' ) ).not.toBeInTheDocument();
	} );

	it.each( [ 'Share your link', 'Share your newsletter' ] )(
		'"%s" opens the Share modal with the site URL',
		label => {
			render( <Stage /> );

			clickButton( label );

			expect( screen.getByTestId( 'share-modal' ) ).toBeInTheDocument();
			expect( mockShareModalProps ).toHaveBeenCalledWith(
				expect.objectContaining( { siteUrl: SITE_URL } )
			);
		}
	);

	it( 'leaves them inert when the server sent no site URL', () => {
		mockGetNewsletterScriptData.mockReturnValue( { greetingName: '', writeUrl: WRITE_URL } );

		render( <Stage /> );

		expect( screen.queryAllByRole( 'button' ) ).toHaveLength( 0 );
	} );
} );
