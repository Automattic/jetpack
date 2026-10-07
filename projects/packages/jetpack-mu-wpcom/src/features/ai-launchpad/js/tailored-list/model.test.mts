import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	ctaKind,
	nextIncompleteId,
	isCompleteOnClickTask,
	isTaskActionable,
	resolveCtaUrl,
	tasksFromFixture,
	toNavigableUrl,
} from './model.ts';
import type { CtaKind, EnrichedTask } from './model.ts';
import type { TailoredOutput } from '../lib/types.ts';

const fixture: TailoredOutput = {
	tasks: [
		{ id: 'woo_products', subtitle: 'Add your first handmade ceramics to the shop.' },
		{ id: 'site_launched', subtitle: 'Launch the shop and start selling.' },
	],
	inferred: { goal: 'sell' },
	first_post_draft: { title: 'Meet Terra Ceramics', paragraphs: [ 'One.', 'Two.' ] },
	about_page_draft: { title: 'About Terra Ceramics', paragraphs: [ 'One.', 'Two.' ] },
};

/** The fields a case varies, on top of the defaults below. */
type Overrides = Partial< EnrichedTask > & { id: string };

/**
 * Build an enriched task with sensible defaults for the field under test.
 *
 * @param overrides - Fields to override.
 * @return An enriched task.
 */
function task( overrides: Partial< EnrichedTask > = {} ): EnrichedTask {
	return {
		id: 'site_theme_selected',
		subtitle: 'Pick a theme.',
		title: 'Choose a design',
		completed: false,
		in_progress: false,
		disabled: false,
		calypso_path: '/themes/example.com',
		...overrides,
	};
}

describe( 'ctaKind', () => {
	// The page kinds are pinned through resolveCtaUrl's distinct handler URLs below.
	const CTA_KINDS: Array< [ string, CtaKind ] > = [
		[ 'first_post_published_newsletter', 'first_post' ],
		[ 'blog_launched', 'launch' ],
		[ 'link_in_bio_launched', 'launch' ],
		// Remapped to site_launched server-side; a stray one must not be treated as a launch task.
		[ 'woo_launch_site', 'deeplink' ],
	];

	for ( const [ id, kind ] of CTA_KINDS ) {
		it( `routes "${ id }" to the ${ kind } CTA`, () => assert.equal( ctaKind( id ), kind ) );
	}
} );

describe( 'toNavigableUrl', () => {
	it( 'pins a Calypso path to wordpress.com, not the site host', () =>
		assert.equal(
			toNavigableUrl( '/me#complete-your-profile' ),
			'https://wordpress.com/me#complete-your-profile'
		) );

	for ( const url of [
		'/wp-admin/post.php?post=1',
		'/wp-admin',
		'/wp-admin/',
		'/wp-admin?foo=bar',
	] ) {
		it( `leaves "${ url }" untouched`, () => assert.equal( toNavigableUrl( url ), url ) );
	}
} );

describe( 'isTaskActionable', () => {
	// Every case passes a null AI output, so a create-content task needs a draft to be actionable.
	const CASES: Array< [ string, Partial< EnrichedTask >, string | null, boolean ] > = [
		[
			'a launch task with a usable site URL',
			{ id: 'site_launched' },
			'https://example.com',
			true,
		],
		[ 'a launch task with no site URL', { id: 'site_launched' }, null, false ],
		[ 'a launch task with a malformed site URL', { id: 'site_launched' }, 'not-a-url', false ],
		[
			'an in-progress task with a draft to reopen',
			{ id: 'add_about_page', in_progress: true, calypso_path: '/wp-admin/post.php?post=9' },
			null,
			true,
		],
		[
			'an in-progress task with no draft path',
			{ id: 'add_about_page', in_progress: true },
			null,
			false,
		],
		[
			'a disabled preview task',
			{ id: 'woo_products', disabled: true, calypso_path: '/themes/example.com' },
			null,
			false,
		],
	];

	for ( const [ name, overrides, siteUrl, expected ] of CASES ) {
		it( `${ expected ? 'is' : 'is not' } actionable for ${ name }`, () => {
			const subject = task( { calypso_path: null, ...overrides } );
			assert.equal( isTaskActionable( subject, null, siteUrl ), expected );
		} );
	}

	for ( const id of [
		'add_contact_page',
		'add_events_page',
		'add_video_page',
		'add_portfolio_piece',
	] ) {
		it( `treats ${ id } as a create-content task, actionable once the output exists`, () => {
			const subject = task( { id, calypso_path: null } );

			assert.equal( isTaskActionable( subject, null ), false );
			assert.equal( isTaskActionable( subject, fixture ), true );
		} );
	}
} );

describe( 'isCompleteOnClickTask', () => {
	it( 'is true for acknowledgment tasks with no Atomic completion signal', () => {
		for ( const id of [
			'complete_profile',
			'earn_money',
			'site_monitoring_page',
			'setup_ssh',
			'share_site',
			'pick_fonts_colors',
		] ) {
			assert.equal( isCompleteOnClickTask( id ), true, id );
		}
	} );

	it( 'is false for tasks that complete via a real signal or listener', () => {
		for ( const id of [
			'first_post_published',
			'site_theme_selected',
			'woo_products',
			'add_site_icon',
		] ) {
			assert.equal( isCompleteOnClickTask( id ), false, id );
		}
	} );
} );

describe( 'resolveCtaUrl', () => {
	/**
	 * Build CtaHandlers that record the clicked task IDs and return marker URLs.
	 *
	 * @return The stub handlers and a record of clicked task IDs.
	 */
	function stubHandlers() {
		const clicked: string[] = [];
		return {
			clicked,
			handlers: {
				trackTaskCtaClicked: ( props: { task_id: string } ) => clicked.push( props.task_id ),
				createFirstPostDraft: async () => ( { post_id: 1, edit_url: '/wp-admin/post.php?post=1' } ),
				createAboutPage: async () => ( { page_id: 2, edit_url: '/wp-admin/post.php?post=2' } ),
				createGalleryPage: async () => ( { page_id: 3, edit_url: '/wp-admin/post.php?post=3' } ),
				createContactPage: async () => ( { page_id: 4, edit_url: '/wp-admin/post.php?post=4' } ),
				createEventsPage: async () => ( { page_id: 5, edit_url: '/wp-admin/post.php?post=5' } ),
				createVideoPage: async () => ( { page_id: 6, edit_url: '/wp-admin/post.php?post=6' } ),
				createPortfolioPiece: async () => ( {
					page_id: 10,
					edit_url: '/wp-admin/post.php?post=10',
				} ),
			},
		};
	}

	// Each handler returns a distinct URL, so landing on the wrong one shows up as the wrong URL.
	// [ test name, task overrides, expected URL, site URL ]
	const CASES: Array< [ string, Overrides, string | null, string? ] > = [
		[
			'pins a plain task’s Calypso deeplink to wordpress.com',
			{ id: 'site_theme_selected', calypso_path: '/themes/x' },
			'https://wordpress.com/themes/x',
		],
		[
			'passes an absolute Stripe deeplink through unchanged',
			{ id: 'stripe_connected', calypso_path: 'https://connect.stripe.com/setup/x' },
			'https://connect.stripe.com/setup/x',
		],
		[
			'drafts a post and returns its editor URL for first-creation tasks',
			{ id: 'first_post_published' },
			'/wp-admin/post.php?post=1',
		],
		[
			'writes the AI-drafted About page and returns its editor URL',
			{ id: 'add_about_page' },
			'/wp-admin/post.php?post=2',
		],
		[
			'builds the gallery page and returns its editor URL',
			{ id: 'add_gallery_page' },
			'/wp-admin/post.php?post=3',
		],
		[
			'writes the contact page and returns its editor URL',
			{ id: 'add_contact_page' },
			'/wp-admin/post.php?post=4',
		],
		[
			'writes the events page and returns its editor URL',
			{ id: 'add_events_page' },
			'/wp-admin/post.php?post=5',
		],
		[
			'writes the video page and returns its editor URL',
			{ id: 'add_video_page' },
			'/wp-admin/post.php?post=6',
		],
		[
			'writes the portfolio piece and returns its editor URL',
			{ id: 'add_portfolio_piece' },
			'/wp-admin/post.php?post=10',
		],
		[
			'reopens the existing draft instead of creating a new one',
			{ id: 'first_post_published', in_progress: true, calypso_path: '/wp-admin/post.php?post=7' },
			'/wp-admin/post.php?post=7',
		],
		[
			'sends launch tasks to the wordpress.com launch flow built from the site URL',
			{ id: 'site_launched' },
			'https://wordpress.com/start/launch-site?siteSlug=example.wpcomstaging.com&ref=wp-admin',
			'https://example.wpcomstaging.com',
		],
		[
			'returns null for a launch task when the site URL is unavailable',
			{ id: 'site_launched' },
			null,
		],
	];

	for ( const [ name, overrides, expected, siteUrl ] of CASES ) {
		it( name, async () => {
			const { clicked, handlers } = stubHandlers();
			const url = await resolveCtaUrl(
				task( { calypso_path: null, ...overrides } ),
				fixture,
				handlers,
				siteUrl ?? null
			);
			assert.equal( url, expected );
			assert.deepEqual( clicked, [ overrides.id ] );
		} );
	}

	it( 'hands the About page its draft, and undefined for an output without one', async () => {
		const received: unknown[] = [];
		const { handlers } = stubHandlers();
		handlers.createAboutPage = async ( draft?: TailoredOutput[ 'about_page_draft' ] ) => {
			received.push( draft );
			return { page_id: 2, edit_url: '/wp-admin/post.php?post=2' };
		};
		const legacy = { ...fixture };
		delete ( legacy as Record< string, unknown > ).about_page_draft;
		const aboutTask = task( { id: 'add_about_page', calypso_path: null } );

		await resolveCtaUrl( aboutTask, fixture, handlers );
		const legacyUrl = await resolveCtaUrl( aboutTask, legacy, handlers );

		assert.deepEqual( received, [ fixture.about_page_draft, undefined ] );
		assert.equal( legacyUrl, '/wp-admin/post.php?post=2' );
	} );

	it( 'hands each page task its own intro, and undefined when the output carries none', async () => {
		const PAGE_TASKS = [
			[ 'add_contact_page', 'createContactPage', 'Ask about a commission.' ],
			[ 'add_events_page', 'createEventsPage', 'Throw a pot with us on a Saturday morning.' ],
			[ 'add_video_page', 'createVideoPage', 'Every glaze test, filmed start to finish.' ],
			[ 'add_gallery_page', 'createGalleryPage', 'A year of finished pieces in one place.' ],
		] as const;

		const received: Record< string, unknown[] > = {};
		const { handlers } = stubHandlers();
		const page_intros: Record< string, string > = {};
		for ( const [ id, handler, intro ] of PAGE_TASKS ) {
			received[ id ] = [];
			page_intros[ id ] = intro;
			( handlers as unknown as Record< string, unknown > )[ handler ] = async ( line?: string ) => {
				received[ id ].push( line );
				return { page_id: 1, edit_url: '/wp-admin/post.php?post=1' };
			};
		}
		const tailored: TailoredOutput = {
			...fixture,
			page_intros: page_intros as TailoredOutput[ 'page_intros' ],
		};

		for ( const [ id ] of PAGE_TASKS ) {
			await resolveCtaUrl( task( { id, calypso_path: null } ), tailored, handlers );
			await resolveCtaUrl( task( { id, calypso_path: null } ), fixture, handlers );
		}

		assert.deepEqual(
			received,
			Object.fromEntries( PAGE_TASKS.map( ( [ id, , intro ] ) => [ id, [ intro, undefined ] ] ) )
		);
	} );
} );

describe( 'nextIncompleteId', () => {
	/**
	 * Build a task list from a compact spec: `a` is incomplete, `a!` completed, `a~` disabled.
	 *
	 * @param spec - Space-separated task specs, in render order.
	 * @return The enriched tasks.
	 */
	function listOf( spec: string ): EnrichedTask[] {
		return spec.split( ' ' ).map( item =>
			task( {
				id: item[ 0 ],
				completed: item.includes( '!' ),
				disabled: item.includes( '~' ),
			} )
		);
	}

	const CASES: Array< [ string, string, string | undefined, string | null ] > = [
		[ 'returns the first incomplete task id', 'a! b c', undefined, 'b' ],
		[ 'returns null when everything is complete', 'a! b!', undefined, null ],
		[ 'advances to the next incomplete task after the given id', 'a! b c', 'b', 'c' ],
		[
			'wraps back to a remaining incomplete task when none follow the given id',
			'a b c!',
			'b',
			'a',
		],
		[ 'skips disabled preview tasks as auto-expand targets', 'a~ b~ c', undefined, 'c' ],
	];

	for ( const [ name, spec, afterId, expected ] of CASES ) {
		it( name, () => assert.equal( nextIncompleteId( listOf( spec ), afterId ), expected ) );
	}
} );

describe( 'tasksFromFixture', () => {
	it( 'derives incomplete tasks with humanized titles from the output', () => {
		const derived = tasksFromFixture( fixture );

		assert.equal( derived.length, fixture.tasks.length );
		assert.deepEqual( derived[ 0 ], {
			id: 'woo_products',
			subtitle: fixture.tasks[ 0 ].subtitle,
			title: 'Woo Products',
			completed: false,
			in_progress: false,
			disabled: false,
			calypso_path: null,
		} );
	} );
} );
