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
// The three entry points into Add Subscribers — the "Bring your contacts" and
// "Invite by email" tiles, and the "Bring your first readers" checklist row:
//
// 4. each LINKS to the Subscribers page with the modal deep-linked to the tab
//    its copy promised — CSV upload for the import tile, the manual address
//    list for the other two. Links, not a modal rendered here, so this route
//    doesn't carry the import stack (see `getAddSubscribersUrl()`).
// 5. nothing else on the page is a link — an entry point with no destination
//    must not advertise an affordance it doesn't have.
// 6. all three go inert when the site can't manage subscribers, rather than
//    pointing at a page that would only refuse. That gate mirrors the one the
//    Subscribers page applies: Simple sites always pass; everywhere else needs
//    a registered site, a connected owner, and a connected user.

const mockGetNewsletterScriptData = jest.fn< { greetingName?: string } | undefined, [] >();
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

import { render, screen } from '@testing-library/react';
import { stage as Stage } from '../routes/home/stage';

const CONNECTED = {
	isRegistered: true,
	hasConnectedOwner: true,
	isUserConnected: true,
};

const SUBSCRIBERS_PAGE = 'https://example.com/wp-admin/admin.php?page=jetpack-newsletter';

beforeEach( () => {
	mockGetNewsletterScriptData.mockReset();
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

describe( 'Newsletter Mode dashboard Add Subscribers entry points', () => {
	it( 'makes links of exactly the three entry points', () => {
		render( <Stage /> );

		expect( screen.getAllByRole( 'link' ).map( anchor => anchor.textContent ) ).toEqual( [
			expect.stringContaining( 'Bring your contacts' ),
			expect.stringContaining( 'Invite by email' ),
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

	it( 'leaves every entry point inert when the site cannot manage subscribers', () => {
		mockIsSimpleSite.mockReturnValue( false );
		mockConnection.mockReturnValue( { ...CONNECTED, isUserConnected: false } );

		render( <Stage /> );

		expect( screen.queryAllByRole( 'link' ) ).toHaveLength( 0 );
	} );

	it( 'keeps them live on a Simple site, which never carries a connection', () => {
		mockIsSimpleSite.mockReturnValue( true );
		mockConnection.mockReturnValue( {
			isRegistered: false,
			hasConnectedOwner: false,
			isUserConnected: false,
		} );

		render( <Stage /> );

		expect( screen.getAllByRole( 'link' ) ).toHaveLength( 3 );
	} );
} );
