import { act, render, screen, waitFor } from '@testing-library/react';
import { useReducedMotion } from '@wordpress/compose';
import { SitePortrait, hasPortrait } from '../site-portrait';
import type { OnboardingSite } from '../lib';

/*
 * The hook caches one media query list per window, so a `matchMedia` stub put
 * in place after the first render of the file never reaches it.
 */
jest.mock( '@wordpress/compose', () => ( {
	...jest.requireActual( '@wordpress/compose' ),
	useReducedMotion: jest.fn( () => false ),
} ) );

const site = ( over: Partial< OnboardingSite > = {} ): OnboardingSite => ( {
	url: 'https://example.com',
	domain: 'example.com',
	canPhotograph: true,
	counts: { posts: 12, pages: 3, media: 40, plugins: 7 },
	...over,
} );

const mockFetch = jest.fn();

beforeEach( () => {
	mockFetch.mockReset();
	window.fetch = mockFetch as unknown as typeof window.fetch;
} );

const answers = ( type: string ) =>
	Promise.resolve( { headers: { get: () => type } } as unknown as Response );

describe( 'What the portrait is willing to show', () => {
	it( 'says nothing at all for a site with no picture and no counts', () => {
		expect(
			hasPortrait(
				site( { canPhotograph: false, counts: { posts: 0, pages: 0, media: 0, plugins: 0 } } )
			)
		).toBe( false );
	} );

	it( 'shows counts even when the site cannot be photographed', () => {
		expect( hasPortrait( site( { canPhotograph: false } ) ) ).toBe( true );
	} );

	it( 'shows the picture even for a site with nothing in it yet', () => {
		expect( hasPortrait( site( { counts: { posts: 0, pages: 0, media: 0, plugins: 0 } } ) ) ).toBe(
			true
		);
	} );

	/*
	 * A zero is how an unmeasured field is spelled at least as often as it is a
	 * real count. "0 posts published" on a site with posts is a claim; leaving the
	 * line out is not.
	 */
	it( 'leaves out a count of zero rather than reporting it', () => {
		mockFetch.mockReturnValue( answers( 'image/gif' ) );

		render(
			<SitePortrait site={ site( { counts: { posts: 4, pages: 0, media: 0, plugins: 2 } } ) } />
		);

		expect( screen.getByText( /posts published/ ) ).toBeInTheDocument();
		expect( screen.getByText( /plugins installed/ ) ).toBeInTheDocument();
		expect( screen.queryByText( /page published/ ) ).not.toBeInTheDocument();
		expect( screen.queryByText( /media library/ ) ).not.toBeInTheDocument();
	} );

	// A frame around nothing promises a photograph that will never arrive.
	it( 'draws no browser window for a site it cannot photograph', () => {
		render( <SitePortrait site={ site( { canPhotograph: false } ) } /> );

		expect( screen.queryByText( 'example.com' ) ).not.toBeInTheDocument();
		expect( mockFetch ).not.toHaveBeenCalled();
	} );
} );

describe( 'Waiting for the screenshot', () => {
	// The picture carries an empty alt on purpose, so `presentation` is the only
	// role it has, and the whole portrait is aria-hidden, so it must be asked for.
	const picture = () => screen.queryByRole( 'presentation', { hidden: true } );

	/*
	 * The service answers 200 with a placeholder while it renders and 200 with the
	 * picture once it has. The content type is the only thing between them: both
	 * are 400 by 300, so there is nothing in the pixels to measure.
	 */
	it( 'shows nothing while the service is still rendering', async () => {
		mockFetch.mockReturnValue( answers( 'image/gif' ) );

		render( <SitePortrait site={ site() } /> );

		await waitFor( () => expect( mockFetch ).toHaveBeenCalled() );
		expect( picture() ).toBeNull();
	} );

	it( 'shows the picture once the type says it is one', async () => {
		mockFetch.mockReturnValue( answers( 'image/jpeg' ) );

		render( <SitePortrait site={ site() } /> );

		await waitFor( () => expect( picture() ).not.toBeNull() );
		expect( picture() ).toHaveAttribute(
			'src',
			expect.stringContaining( 'mshots/v1/https%3A%2F%2Fexample.com' )
		);
	} );

	// The URL is what the service keys its render on, so it must not vary.
	it( 'polls the same address every time', async () => {
		mockFetch.mockReturnValue( answers( 'image/gif' ) );

		render( <SitePortrait site={ site() } /> );

		await waitFor( () => expect( mockFetch ).toHaveBeenCalled() );
		const asked = mockFetch.mock.calls.map( ( [ url ] ) => url );

		expect( new Set( asked ).size ).toBe( 1 );
	} );

	it( 'gives up quietly when the service never answers', async () => {
		mockFetch.mockRejectedValue( new Error( 'offline' ) );

		render( <SitePortrait site={ site() } /> );

		await waitFor( () => expect( mockFetch ).toHaveBeenCalled() );
		expect( picture() ).toBeNull();
		// The counts are still there: the picture is the part that can fail.
		expect( screen.getByText( /posts published/ ) ).toBeInTheDocument();
	} );
} );

describe( 'Counting the numeral up', () => {
	/*
	 * The count runs on real animation frames after a real delay, so the test
	 * drives both: `frame` runs the pending callback at a chosen point on the
	 * clock, which is the only way to assert on a frame rather than on whichever
	 * one the machine happened to render first.
	 */
	let pending: FrameRequestCallback | null;
	let clock: number;
	// Restored one by one: `restoreAllMocks` also takes out the console spies the
	// monorepo's Jest setup installs, and its own teardown then throws on them.
	let spies: jest.SpyInstance[];

	const frame = ( at: number ) => {
		clock = at;
		const run = pending;
		pending = null;
		act( () => run?.( clock ) );
	};

	const begin = () => act( () => jest.runOnlyPendingTimers() );

	const row = ( match: RegExp ) => screen.getByText( match, { selector: 'p' } ).textContent;

	beforeEach( () => {
		pending = null;
		clock = 0;
		jest.useFakeTimers();
		mockFetch.mockReturnValue( answers( 'image/gif' ) );
		spies = [
			jest
				.spyOn( window, 'requestAnimationFrame' )
				.mockImplementation( cb => ( ( pending = cb ), 1 ) ),
			jest.spyOn( window, 'cancelAnimationFrame' ).mockImplementation( () => {
				pending = null;
			} ),
		];
	} );

	afterEach( () => {
		act( () => jest.runOnlyPendingTimers() );
		jest.useRealTimers();
		jest.mocked( useReducedMotion ).mockReturnValue( false );
		spies.forEach( spy => spy.mockRestore() );
	} );

	const withPosts = ( posts: number ) =>
		render(
			<SitePortrait site={ site( { counts: { posts, pages: 0, media: 0, plugins: 0 } } ) } />
		);

	it( 'shows the real number until the row it sits in starts moving', () => {
		withPosts( 240 );

		expect( pending ).toBeNull();
		expect( row( /posts published/ ) ).toBe( '240 posts published' );
	} );

	it( 'counts from zero once the row starts moving', () => {
		withPosts( 240 );
		begin();

		expect( row( /posts published/ ) ).toBe( '0 posts published' );
	} );

	it( 'is partway there partway through', () => {
		withPosts( 240 );
		begin();
		frame( 0 );
		frame( 450 );

		const shown = Number( row( /posts published/ )?.split( ' ' )[ 0 ] );

		expect( shown ).toBeGreaterThan( 0 );
		expect( shown ).toBeLessThan( 240 );
	} );

	// The last frame must be the translated string, not our own rendering of it.
	it( 'lands on the real number and stops', () => {
		withPosts( 240 );
		begin();
		frame( 0 );
		frame( 900 );

		expect( row( /posts published/ ) ).toBe( '240 posts published' );
		expect( pending ).toBeNull();
	} );

	/*
	 * Every frame of a count-up is a number the site does not have. At 1 it is
	 * almost all of them, held long enough to read as a fact rather than motion,
	 * and the fact it states is the zero `statLines` filters out.
	 */
	it( 'never counts a number too small to read as counting', () => {
		withPosts( 1 );
		begin();

		expect( pending ).toBeNull();
		expect( row( /post published/ ) ).toBe( '1 post published' );
	} );

	it( 'does not count at all when motion is turned down', () => {
		jest.mocked( useReducedMotion ).mockReturnValue( true );

		withPosts( 240 );
		begin();

		expect( pending ).toBeNull();
		expect( row( /posts published/ ) ).toBe( '240 posts published' );
	} );
} );
