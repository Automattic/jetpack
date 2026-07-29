// The Newsletter Mode Dashboard has two faces: the onboarding view it opens on,
// and the stats view it is meant to become once a newsletter has an audience.
//
// The 3+ subscriber rule that should decide between them is not wired yet, so
// the switch is manual. Two ways in, and both matter:
//
// 1. `?view=stats` / `?view=onboarding` on the URL. This is the reliable one —
//    Chrome and Firefox on macOS bind Cmd+J to their own Downloads window and a
//    page cannot take a browser shortcut back, so the shortcut may never fire.
//    It also makes either state a shareable link.
// 2. The Cmd+J shortcut, which flips between them.
//
// The URL wins over the remembered choice, and the choice is remembered across
// loads so that clicking into Settings and back does not reset a review.
//
// The headline figures and the chart are still placeholders, and the assertions
// below pin the mockup's numbers so they fail loudly when real data arrives.
// The Recent Posts table is NOT a placeholder: it joins core `wp/v2/posts`
// against the Stats module's per-post email summary. That second request is
// optional by design — no connection, Stats switched off, or simply nothing
// emailed yet all land on the same empty-cell path, which is covered here.

const mockGetNewsletterScriptData = jest.fn< Record< string, unknown > | undefined, [] >();
const mockConnection = jest.fn< Record< string, unknown >, [] >();
const mockLineChartProps = jest.fn();
const mockUseKeyboardShortcut = jest.fn();
const mockApiFetch = jest.fn();

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getSiteData: () => ( {
		rest_root: 'https://example.com/wp-json/',
		rest_nonce: 'test-nonce',
		date_format: 'M j, Y',
		// The Recent Posts table reads this to build the Stats route; 0 here would
		// mean "disconnected" and skip the request entirely.
		wpcom: { blog_id: 4242 },
	} ),
	getAdminUrl: ( path: string ) => `https://example.com/wp-admin/${ path }`,
	isSimpleSite: () => true,
} ) );

jest.mock( '@automattic/jetpack-connection/use-connection', () => ( {
	__esModule: true,
	default: () => mockConnection(),
} ) );

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( options: { path: string } ) => mockApiFetch( options ),
} ) );

// The one-time intro is modal, so leaving it up would make the page behind it
// inert and unreachable. These suites are about that page; the intro has its
// own coverage in intro-modal.test.tsx.
jest.mock( '../routes/home/intro-modal', () => ( {
	IntroModal: () => null,
} ) );

jest.mock( '../src/settings/script-data', () => ( {
	getNewsletterModeScriptData: () => mockGetNewsletterScriptData(),
} ) );

jest.mock( '@automattic/jetpack-components/admin-page', () => ( {
	__esModule: true,
	default: ( { children } ) => <div data-testid="admin-page">{ children }</div>,
} ) );

jest.mock( '../_inc/share/share-newsletter-modal', () => ( {
	__esModule: true,
	default: () => <div data-testid="share-modal" />,
} ) );

// The real chart pulls visx and renders a live SVG — slow to mount and brittle
// to assert against. Record the props instead, which is what we actually care
// about: the series handed to it.
jest.mock( '@automattic/charts', () => ( {
	__esModule: true,
	LineChart: ( props: Record< string, unknown > ) => {
		mockLineChartProps( props );
		return <div data-testid="line-chart" />;
	},
} ) );

jest.mock( '@automattic/charts/style.css', () => ( {} ), { virtual: true } );

// Capture the shortcut registration rather than driving Mousetrap through jsdom:
// what matters is that the right chord is bound and that firing it toggles.
jest.mock( '@wordpress/compose', () => ( {
	...jest.requireActual( '@wordpress/compose' ),
	useKeyboardShortcut: ( shortcut: string, callback: ( event: Event ) => void ) => {
		mockUseKeyboardShortcut( shortcut, callback );
	},
} ) );

import { act, render, screen, within } from '@testing-library/react';
import { queryClient } from '../_inc/subscribers/lib/query-client';
import { stage as Stage } from '../routes/home/stage';

const NEWSLETTER_HOME = '/wp-admin/admin.php?page=jetpack-newsletter-home';

const SCRIPT_DATA = {
	greetingName: 'Zara',
	writeUrl: 'https://example.com/wp-admin/post-new.php',
	siteUrl: 'https://octagonal.example.com',
	settingsUrl: 'https://example.com/wp-admin/admin.php?page=jetpack-newsletter',
	monetizeUrl: 'https://wordpress.com/earn/octagonal.example.com',
	postsUrl: 'https://example.com/wp-admin/edit.php?newsletter-mode=1',
	checklistCompleted: [],
};

/**
 * Point the address at the Dashboard, optionally asking for a view.
 *
 * @param view - Value for the `view` param, if any.
 */
function visitDashboard( view?: string ): void {
	window.history.replaceState(
		{},
		'',
		view ? `${ NEWSLETTER_HOME }&view=${ view }` : NEWSLETTER_HOME
	);
}

/** Fire the registered keyboard shortcut. */
function pressShortcut(): void {
	const [ , callback ] = mockUseKeyboardShortcut.mock.calls.at( -1 ) ?? [];

	act( () => callback( { preventDefault: jest.fn() } as unknown as Event ) );
}

/** Two posts as `wp/v2/posts` returns them: one sent, one unsent draft. */
const POSTS_RESPONSE = [
	{
		id: 11,
		date: '2026-07-23T09:00:00',
		status: 'publish',
		title: { rendered: 'Parasite &amp; friends' },
		_embedded: {
			'wp:featuredmedia': [
				{ media_details: { sizes: { thumbnail: { source_url: 'https://example.com/t.jpg' } } } },
			],
		},
	},
	{
		id: 12,
		date: '2026-07-24T09:00:00',
		status: 'draft',
		title: { rendered: 'The Green Knight' },
		// No featured image, but an image in the body — the common case for a post
		// written without anyone setting a featured image.
		content: {
			rendered: '<p>Words</p><img src="https://example.com/in-body.jpg" alt="" />',
		},
	},
];

/** The Stats module's summary — only the published post was ever emailed. */
const EMAIL_STATS_RESPONSE = {
	posts: [ { id: 11, total_sends: 122, opens_rate: 58, clicks_rate: 21 } ],
};

/**
 * Answer each request the stats view makes.
 *
 * @param emailStats - What the Stats route should resolve to.
 */
function respondWith( emailStats: unknown = EMAIL_STATS_RESPONSE ) {
	mockApiFetch.mockImplementation( ( { path }: { path: string } ) => {
		if ( path.startsWith( '/wp/v2/posts' ) ) {
			return Promise.resolve( POSTS_RESPONSE );
		}
		if ( path.includes( '/stats/emails/summary' ) ) {
			return Promise.resolve( emailStats );
		}
		return Promise.resolve( {} );
	} );
}

const isOnboarding = () => screen.queryByText( 'Reach your first 3 subscribers' ) !== null;
const isStats = () => screen.queryByText( 'Recent Posts' ) !== null;

beforeEach( () => {
	mockGetNewsletterScriptData.mockReset();
	mockGetNewsletterScriptData.mockReturnValue( SCRIPT_DATA );
	mockConnection.mockReset();
	mockConnection.mockReturnValue( {
		isRegistered: true,
		hasConnectedOwner: true,
		isUserConnected: true,
	} );
	mockLineChartProps.mockReset();
	mockUseKeyboardShortcut.mockReset();
	mockApiFetch.mockReset();
	respondWith();
	// The query client is a module singleton shared with the Subscribers page, so
	// without this a later test is served the previous one's cached rows and never
	// issues a request at all.
	queryClient.clear();
	window.localStorage.clear();
	visitDashboard();
} );

afterEach( () => {
	window.history.replaceState( {}, '', NEWSLETTER_HOME );
} );

describe( 'Newsletter Mode Dashboard view switching', () => {
	it( 'opens on the onboarding view', () => {
		render( <Stage /> );

		expect( isOnboarding() ).toBe( true );
		expect( isStats() ).toBe( false );
	} );

	it( 'opens on the stats view when the address asks for it', () => {
		visitDashboard( 'stats' );

		render( <Stage /> );

		expect( isStats() ).toBe( true );
		expect( isOnboarding() ).toBe( false );
	} );

	it( 'binds the toggle to Cmd/Ctrl+J', () => {
		render( <Stage /> );

		expect( mockUseKeyboardShortcut ).toHaveBeenCalledWith( 'mod+j', expect.any( Function ) );
	} );

	it( 'flips between the two views when the shortcut fires', () => {
		render( <Stage /> );
		expect( isOnboarding() ).toBe( true );

		pressShortcut();
		expect( isStats() ).toBe( true );

		pressShortcut();
		expect( isOnboarding() ).toBe( true );
	} );

	it( 'remembers the choice across a reload', () => {
		const { unmount } = render( <Stage /> );

		pressShortcut();
		expect( isStats() ).toBe( true );

		unmount();
		render( <Stage /> );

		expect( isStats() ).toBe( true );
	} );

	it( 'lets the address override what was remembered', () => {
		const { unmount } = render( <Stage /> );

		pressShortcut();
		unmount();

		// Remembered as stats, but the address asks for onboarding.
		visitDashboard( 'onboarding' );
		render( <Stage /> );

		expect( isOnboarding() ).toBe( true );
	} );

	it( 'ignores a view name it does not recognise', () => {
		visitDashboard( 'something-else' );

		render( <Stage /> );

		expect( isOnboarding() ).toBe( true );
	} );
} );

describe( 'Newsletter Mode Dashboard stats view', () => {
	beforeEach( () => {
		visitDashboard( 'stats' );
	} );

	it( 'shows the four headline figures', () => {
		render( <Stage /> );

		// Scoped to the bar: 122 is also a recipient count in the table below.
		const bar = within( screen.getByRole( 'group', { name: 'Newsletter performance' } ) );

		expect( bar.getByText( 'Total subscribers' ) ).toBeInTheDocument();
		expect( bar.getByText( '122' ) ).toBeInTheDocument();
		expect( bar.getByText( 'Open rate' ) ).toBeInTheDocument();
		expect( bar.getByText( '62%' ) ).toBeInTheDocument();
		expect( bar.getByText( 'Click rate' ) ).toBeInTheDocument();
		expect( bar.getByText( '14%' ) ).toBeInTheDocument();
		expect( bar.getByText( 'CTOR' ) ).toBeInTheDocument();
		expect( bar.getByText( '23%' ) ).toBeInTheDocument();
	} );

	it( 'explains CTOR, which the label alone does not', () => {
		render( <Stage /> );

		expect( screen.getByLabelText( /Click-to-open rate/ ) ).toBeInTheDocument();
	} );

	it( 'greets the same way the onboarding view does', () => {
		render( <Stage /> );

		expect( screen.getByRole( 'heading', { level: 1 } ) ).toHaveTextContent( 'Welcome, Zara' );
	} );

	it( 'draws the subscribers series with a gradient fill', () => {
		render( <Stage /> );

		expect( mockLineChartProps ).toHaveBeenCalledWith(
			expect.objectContaining( { withGradientFill: true } )
		);
	} );

	it( 'redraws the series when the cadence changes', () => {
		render( <Stage /> );

		const pointsFor = () => {
			const props = mockLineChartProps.mock.calls.at( -1 )?.[ 0 ];
			return props.data[ 0 ].data.length;
		};

		// 30 daily points is the default; weeks covers more ground in fewer.
		expect( pointsFor() ).toBe( 30 );

		const weeks = screen.getByRole( 'button', { name: 'Weeks' } );
		act( () => weeks.click() );

		expect( pointsFor() ).toBe( 26 );
	} );

	it( 'leaves the period arrows inert, since there is no history to page through', () => {
		render( <Stage /> );

		// `@wordpress/ui` keeps disabled buttons focusable and marks them with
		// `aria-disabled` rather than the native attribute, so assert on that.
		expect( screen.getByRole( 'button', { name: 'Previous period' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		expect( screen.getByRole( 'button', { name: 'Next period' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'lists the real posts with their email figures', async () => {
		render( <Stage /> );

		const table = within( await screen.findByRole( 'table' ) );

		// Decoded, not the raw `&amp;` the REST API hands back.
		await expect( table.findByText( 'Parasite & friends' ) ).resolves.toBeInTheDocument();
		expect( table.getByText( '122' ) ).toBeInTheDocument();
		expect( table.getByText( '58%' ) ).toBeInTheDocument();
		expect( table.getByText( '21%' ) ).toBeInTheDocument();
	} );

	it( 'asks the Stats module for the send figures, keyed to this blog', async () => {
		render( <Stage /> );

		await expect( screen.findByText( 'Parasite & friends' ) ).resolves.toBeInTheDocument();

		expect( mockApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				path: expect.stringContaining( '/jetpack/v4/stats-app/sites/4242/stats/emails/summary' ),
			} )
		);
	} );

	it( 'leaves the email columns blank for a post that was never sent', async () => {
		render( <Stage /> );

		await expect( screen.findByText( 'The Green Knight' ) ).resolves.toBeInTheDocument();

		// The draft has no row in the summary, so recipients / open / click are
		// empty — an em dash rather than a misleading 0.
		expect( screen.getAllByText( '—' ).length ).toBeGreaterThanOrEqual( 3 );
	} );

	it( 'still lists the posts when the Stats request fails', async () => {
		// No connection, Stats switched off, or a transient error — all the same
		// to the table: the posts stand, the figures go blank.
		mockApiFetch.mockImplementation( ( { path }: { path: string } ) =>
			path.startsWith( '/wp/v2/posts' )
				? Promise.resolve( POSTS_RESPONSE )
				: Promise.reject( new Error( 'stats unavailable' ) )
		);

		render( <Stage /> );

		await expect( screen.findByText( 'Parasite & friends' ) ).resolves.toBeInTheDocument();
		expect( screen.getAllByText( '—' ).length ).toBeGreaterThanOrEqual( 6 );
	} );

	it( 'falls back to the first body image when a post has no featured image', async () => {
		render( <Stage /> );

		const table = within( await screen.findByRole( 'table' ) );
		const images = table.getAllByRole( 'presentation' ) as HTMLImageElement[];
		const sources = images.map( image => image.getAttribute( 'src' ) );

		// The sent post uses its featured image; the draft falls back to the body.
		expect( sources ).toContain( 'https://example.com/t.jpg' );
		expect( sources ).toContain( 'https://example.com/in-body.jpg' );
	} );

	it( 'offers a way to start writing when there are no posts', async () => {
		mockApiFetch.mockImplementation( ( { path }: { path: string } ) =>
			Promise.resolve( path.startsWith( '/wp/v2/posts' ) ? [] : {} )
		);

		render( <Stage /> );

		await expect( screen.findByText( 'No posts yet' ) ).resolves.toBeInTheDocument();
		// The table itself gives way — an empty grid says nothing useful.
		expect( screen.queryByRole( 'table' ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'Write your first post' } ) ).toHaveAttribute(
			'href',
			SCRIPT_DATA.writeUrl
		);
	} );

	it( '"View all" stays inside Newsletter Mode', async () => {
		render( <Stage /> );

		// The mode's own Posts screen, carrying NAV_QUERY_ARG — following it must
		// not drop the visitor back into plain wp-admin.
		await expect( screen.findByRole( 'link', { name: 'View all' } ) ).resolves.toHaveAttribute(
			'href',
			'https://example.com/wp-admin/edit.php?newsletter-mode=1'
		);
	} );

	it( 'strips the data-grid chrome off the posts table', () => {
		render( <Stage /> );

		// A fixed five-row preview has nothing for these to act on, so the table
		// is composed down to just the layout.
		expect( screen.queryByRole( 'button', { name: 'View options' } ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'searchbox' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: /Next page/ } ) ).not.toBeInTheDocument();
	} );
} );
