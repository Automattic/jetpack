import { act, render, screen } from '@testing-library/react';
import { _n } from '@wordpress/i18n';
import { SitePortrait, hasPortrait } from '../site-portrait';
import { useReducedMotion } from '../use-reduced-motion';
import type { OnboardingSite } from '../lib';

// Mocked rather than driven through `matchMedia`, so a test can turn it on part
// way through a count.
jest.mock( '../use-reduced-motion', () => ( { useReducedMotion: jest.fn( () => false ) } ) );

// The module's exports are frozen, so a translation can only be swapped here.
jest.mock( '@wordpress/i18n', () => ( {
	...jest.requireActual( '@wordpress/i18n' ),
	_n: jest.fn( jest.requireActual( '@wordpress/i18n' )._n ),
} ) );

const site = ( over: Partial< OnboardingSite > = {} ): OnboardingSite => ( {
	url: 'https://example.com',
	domain: 'example.com',
	canPhotograph: true,
	counts: { posts: 12, pages: 3, media: 40, plugins: 7 },
	...over,
} );

const show = ( over: Partial< OnboardingSite > = {}, shot: string | null = null ) =>
	render( <SitePortrait site={ site( over ) } shot={ shot } /> );

const posts = ( n: number ) => ( { posts: n, pages: 0, media: 0, plugins: 0 } );

describe( 'What the portrait is willing to show', () => {
	it( 'says nothing at all when the page told us nothing', () => {
		expect( hasPortrait( undefined ) ).toBe( false );
	} );

	/*
	 * The picture is the portrait. On their own the counts are three numbers
	 * centred in a column six hundred pixels tall, so the panel takes its artwork
	 * back instead.
	 */
	it( 'yields the panel entirely when the site cannot be photographed', () => {
		expect( hasPortrait( site( { canPhotograph: false } ) ) ).toBe( false );
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
		show( { counts: { posts: 4, pages: 0, media: 0, plugins: 2 } } );

		expect( screen.getByText( /posts published/ ) ).toBeInTheDocument();
		expect( screen.getByText( /plugins installed/ ) ).toBeInTheDocument();
		expect( screen.queryByText( /page published/ ) ).not.toBeInTheDocument();
		expect( screen.queryByText( /media library/ ) ).not.toBeInTheDocument();
	} );

	// A frame around nothing promises a photograph that will never arrive.
	it( 'draws no browser window for a site it cannot photograph', () => {
		show( { canPhotograph: false } );

		expect( screen.queryByText( 'example.com' ) ).not.toBeInTheDocument();
	} );

	/*
	 * Every fact in it is decorative: the question is on the left, the picture is
	 * of a site the reader is sitting inside, and read aloud the counts are four
	 * numbers with no bearing on the answer.
	 */
	it( 'is hidden from assistive technology in full', () => {
		show( {}, 'https://s0.wp.com/mshots/v1/x' );

		// Present in the page, absent from the accessibility tree.
		expect( screen.getByRole( 'presentation', { hidden: true } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'presentation' ) ).not.toBeInTheDocument();
	} );

	it( 'hangs the picture in the window once there is one', () => {
		show( {}, 'https://s0.wp.com/mshots/v1/x' );

		expect( screen.getByRole( 'presentation', { hidden: true } ) ).toHaveAttribute(
			'src',
			'https://s0.wp.com/mshots/v1/x'
		);
	} );

	// The plate is drawn either way, so the stack does not jump when one arrives.
	it( 'draws the window before the picture arrives', () => {
		show();

		expect( screen.getByText( 'example.com' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'presentation', { hidden: true } ) ).not.toBeInTheDocument();
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

	const withPosts = ( n: number ) => show( { counts: posts( n ) } );

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

	/*
	 * Turning motion down part way through used to strand the numeral on whatever
	 * it had reached, and nothing moved it again.
	 */
	it( 'puts the real number back when motion is turned down mid-count', () => {
		const { rerender } = withPosts( 240 );
		begin();
		frame( 0 );
		frame( 300 );

		expect( row( /posts published/ ) ).not.toBe( '240 posts published' );

		jest.mocked( useReducedMotion ).mockReturnValue( true );
		rerender( <SitePortrait site={ site( { counts: posts( 240 ) } ) } shot={ null } /> );

		expect( row( /posts published/ ) ).toBe( '240 posts published' );
	} );

	/*
	 * jsdom reports no delay, so the stylesheet is stubbed: without this the whole
	 * mechanic could be replaced by a zero and every test would still pass.
	 */
	it( 'waits for the delay the stylesheet gives the row', () => {
		jest
			.spyOn( window, 'getComputedStyle' )
			.mockReturnValue( { animationDelay: '0.34s' } as unknown as CSSStyleDeclaration );

		withPosts( 240 );

		act( () => jest.advanceTimersByTime( 339 ) );
		expect( pending ).toBeNull();

		act( () => jest.advanceTimersByTime( 1 ) );
		expect( pending ).not.toBeNull();
	} );
} );

/*
 * `%1$d` is a legal and common way for a translator to write a lone `%d`, and a
 * plain string replace leaves it on screen with no number in it at all.
 */
describe( 'Numbers a translator may have moved', () => {
	it( 'fills in a positional placeholder', () => {
		jest
			.mocked( _n )
			.mockReturnValue( '<b>%1$d</b> posts published' as unknown as ReturnType< typeof _n > );

		show( { counts: posts( 240 ) } );

		expect( screen.getByText( /posts published/, { selector: 'p' } ) ).toHaveTextContent(
			'240 posts published'
		);
	} );
} );
