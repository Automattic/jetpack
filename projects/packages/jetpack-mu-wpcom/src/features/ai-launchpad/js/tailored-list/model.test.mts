import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { validateAgainstSchema } from '../lib/schema-validator.ts';
import {
	ctaKind,
	nextIncompleteId,
	isCompleteOnClickTask,
	isTaskActionable,
	launchSiteUrl,
	resolveCtaUrl,
	tasksFromFixture,
	toNavigableUrl,
} from './model.ts';
import type { CtaKind, EnrichedTask } from './model.ts';
import type { TailoredOutput } from '../lib/types.ts';

const __dirname = dirname( fileURLToPath( import.meta.url ) );
const CONTRACTS = resolve( __dirname, '../../contracts' );

const schema = JSON.parse(
	readFileSync( resolve( CONTRACTS, 'agent-output-schema.json' ), 'utf8' )
);

// A representative, schema-valid tailored output used to exercise resolveCtaUrl
// and tasksFromFixture (the production no-data fallback path).
const fixture: TailoredOutput = {
	tasks: [
		{ id: 'woo_products', subtitle: 'Add your first handmade ceramics to the shop.' },
		{ id: 'woo_customize_store', subtitle: "Style your store to match Terra's earthy look." },
		{ id: 'set_up_payments', subtitle: 'Set up checkout so customers can buy.' },
		{ id: 'site_theme_selected', subtitle: 'Pick a theme that suits a ceramics studio.' },
		{ id: 'complete_profile', subtitle: 'Tell shoppers the story behind Terra Ceramics.' },
		{ id: 'site_launched', subtitle: 'Launch the shop and start selling.' },
	],
	inferred: {
		goal: 'sell',
		brand_name: 'Terra Ceramics',
		niche: 'handmade ceramics and pottery',
		vibe: 'warm, earthy, artisanal',
		audience: 'design-conscious home decorators',
		tagline: 'Handmade pottery for everyday rituals',
	},
	first_post_draft: {
		title: 'Meet Terra Ceramics',
		subtitle: 'Discover our handmade pottery collection',
		paragraphs: [
			'Every piece at Terra Ceramics starts as a lump of clay and a quiet morning at the wheel.',
			'Browse the shop to find a piece that fits your table, or follow along as we share new work.',
		],
	},
	about_page_draft: {
		title: 'About Terra Ceramics',
		paragraphs: [
			'Terra Ceramics is a one-person pottery studio making small-batch homewares by hand.',
			'Every glaze and curve is shaped at the wheel, to bring a little ritual to everyday tables.',
		],
	},
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

describe( 'sample output', () => {
	it( 'validates against the agent output schema', () => {
		assert.deepEqual( validateAgainstSchema( fixture, schema ), [] );
	} );
} );

describe( 'ctaKind', () => {
	const CTA_KINDS: Array< [ string, CtaKind ] > = [
		// Both first-post twins draft a post.
		[ 'first_post_published', 'first_post' ],
		[ 'first_post_published_newsletter', 'first_post' ],
		[ 'add_about_page', 'about_page' ],
		[ 'add_gallery_page', 'gallery_page' ],
		[ 'add_contact_page', 'contact_page' ],
		[ 'add_events_page', 'events_page' ],
		// Pathless launch tasks open the launch flow.
		[ 'site_launched', 'launch' ],
		[ 'blog_launched', 'launch' ],
		[ 'link_in_bio_launched', 'launch' ],
		// Everything else deeplinks. woo_launch_site is dropped server-side (remapped to
		// site_launched), but guard the client too: were a stray one to reach here it must not be
		// treated as a launch task. The synthetic store tasks navigate to their wp-admin CTAs.
		[ 'site_theme_selected', 'deeplink' ],
		[ 'woo_launch_site', 'deeplink' ],
		[ 'install_woocommerce', 'deeplink' ],
		[ 'setup_woocommerce_store', 'deeplink' ],
	];

	for ( const [ id, kind ] of CTA_KINDS ) {
		it( `routes "${ id }" to the ${ kind } CTA`, () => assert.equal( ctaKind( id ), kind ) );
	}
} );

describe( 'toNavigableUrl', () => {
	// Calypso router paths are relative to wordpress.com: they must not resolve against the
	// site host where the launchpad runs.
	const PINNED: Array< [ string, string ] > = [
		[ '/me#complete-your-profile', 'https://wordpress.com/me#complete-your-profile' ],
		[
			'/marketing/connections/example.com',
			'https://wordpress.com/marketing/connections/example.com',
		],
	];
	for ( const [ path, expected ] of PINNED ) {
		it( `pins the Calypso path "${ path }" to wordpress.com`, () =>
			assert.equal( toNavigableUrl( path ), expected ) );
	}

	// Site-relative wp-admin paths (the root one with or without a query/hash) and absolute
	// URLs are already navigable.
	const UNCHANGED = [
		'/wp-admin/post.php?post=1',
		'/wp-admin',
		'/wp-admin/',
		'/wp-admin?foo=bar',
		'https://example.com/wp-admin/admin.php?page=wc-admin',
		'https://connect.stripe.com/x',
	];
	for ( const url of UNCHANGED ) {
		it( `leaves "${ url }" untouched`, () => assert.equal( toNavigableUrl( url ), url ) );
	}
} );

describe( 'launchSiteUrl', () => {
	it( 'builds the wordpress.com launch-flow URL from the site URL', () => {
		assert.equal(
			launchSiteUrl( 'https://example.wpcomstaging.com' ),
			'https://wordpress.com/start/launch-site?siteSlug=example.wpcomstaging.com&ref=wp-admin'
		);
	} );

	it( 'returns null for a malformed site URL instead of throwing', () => {
		assert.equal( launchSiteUrl( 'not-a-url' ), null );
		assert.equal( launchSiteUrl( '' ), null );
	} );
} );

describe( 'isTaskActionable', () => {
	// Every case passes a null AI output, so a create-content task is non-actionable unless
	// something else — the in-progress draft, the site URL — makes it actionable.
	const CASES: Array< [ string, Partial< EnrichedTask >, string | null, boolean ] > = [
		// A launch task is actionable only when a launch URL can be built from the site URL. An
		// empty or malformed one cannot, so it must not be actionable (stays in lockstep with
		// resolveCtaUrl).
		[
			'a launch task with a usable site URL',
			{ id: 'site_launched' },
			'https://example.com',
			true,
		],
		[ 'a launch task with no site URL', { id: 'site_launched' }, null, false ],
		[ 'a launch task with an empty site URL', { id: 'site_launched' }, '', false ],
		[ 'a launch task with a malformed site URL', { id: 'site_launched' }, 'not-a-url', false ],
		// An in-progress task reopens its draft via calypso_path; with no path there is nothing
		// to reopen.
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
		// Even with an otherwise-actionable shape — a deeplink it could follow — disabled
		// short-circuits to false.
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

	it( 'treats the contact page as a create-content task, actionable once the output exists', () => {
		// It has no catalog deeplink of its own — the CTA is "create the page" — so it is actionable
		// exactly when there is an output to build from, like the other create-content tasks.
		const contact = task( { id: 'add_contact_page', calypso_path: null } );

		assert.equal( isTaskActionable( contact, null ), false );
		assert.equal( isTaskActionable( contact, fixture ), true );
	} );

	it( 'treats the events page as a create-content task, actionable once the output exists', () => {
		const events = task( { id: 'add_events_page', calypso_path: null } );

		assert.equal( isTaskActionable( events, null ), false );
		assert.equal( isTaskActionable( events, fixture ), true );
	} );
} );

describe( 'isCompleteOnClickTask', () => {
	it( 'is true for acknowledgment tasks with no Atomic completion signal', () => {
		for ( const id of [
			'complete_profile',
			'earn_money',
			'site_monitoring_page',
			'setup_ssh',
			'share_site',
			// A registry task: nothing in wp-admin fires when a style variation is applied.
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
			// A registry task too, but one whose completion is read live from the site_icon option.
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
			},
		};
	}

	// Each case clicks one task and pins where it lands; every case also asserts the Tracks
	// event fired with that task's id. The stub creation handlers return distinct marker URLs
	// (post=1 first post, post=2 About, post=3 gallery), so a case that lands on the wrong
	// handler shows up as the wrong URL. The full AI output is passed throughout: the tasks
	// that ignore it must resolve the same way regardless.
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
			'passes an absolute admin_url deeplink through unchanged',
			{ id: 'woo_products', calypso_path: 'https://example.com/wp-admin/admin.php?task=products' },
			'https://example.com/wp-admin/admin.php?task=products',
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
			'reopens the existing contact draft instead of creating a second page',
			{ id: 'add_contact_page', in_progress: true, calypso_path: '/wp-admin/post.php?post=8' },
			'/wp-admin/post.php?post=8',
		],
		[
			'writes the events page and returns its editor URL',
			{ id: 'add_events_page' },
			'/wp-admin/post.php?post=5',
		],
		[
			'reopens the existing events draft instead of creating a second page',
			{ id: 'add_events_page', in_progress: true, calypso_path: '/wp-admin/post.php?post=7' },
			'/wp-admin/post.php?post=7',
		],
		[
			'reopens the existing About draft instead of creating a new page',
			{ id: 'add_about_page', in_progress: true, calypso_path: '/wp-admin/post.php?post=9' },
			'/wp-admin/post.php?post=9',
		],
		[
			'reopens the existing first-post draft instead of drafting a fresh post',
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

	it( 'hands each page task its own input, and undefined for an output without an About draft', async () => {
		// Outputs persisted before about_page_draft existed lack the field; the handler receives
		// undefined and must still be called rather than the CTA falling through to nothing.
		const received: unknown[] = [];
		const { handlers } = stubHandlers();
		handlers.createAboutPage = async ( draft?: TailoredOutput[ 'about_page_draft' ] ) => {
			received.push( draft );
			return { page_id: 2, edit_url: '/wp-admin/post.php?post=2' };
		};
		handlers.createGalleryPage = async ( inferred?: TailoredOutput[ 'inferred' ] ) => {
			received.push( inferred );
			return { page_id: 3, edit_url: '/wp-admin/post.php?post=3' };
		};
		const legacy = { ...fixture };
		delete ( legacy as Record< string, unknown > ).about_page_draft;
		const aboutTask = task( { id: 'add_about_page', calypso_path: null } );

		await resolveCtaUrl(
			task( { id: 'add_gallery_page', calypso_path: null } ),
			fixture,
			handlers
		);
		await resolveCtaUrl( aboutTask, fixture, handlers );
		const legacyUrl = await resolveCtaUrl( aboutTask, legacy, handlers );

		assert.deepEqual( received, [ fixture.inferred, fixture.about_page_draft, undefined ] );
		assert.equal( legacyUrl, '/wp-admin/post.php?post=2' );
	} );

	it( 'hands the contact page its own intro, and undefined when the output carries none', async () => {
		// page_intros is keyed by task id, so the contact task must be handed its own key and nothing
		// else. The baseline fixture has no page_intros at all, standing in both for an output
		// persisted before the field existed and for a run where the model chose to omit it.
		const received: unknown[] = [];
		const { handlers } = stubHandlers();
		handlers.createContactPage = async ( intro?: string ) => {
			received.push( intro );
			return { page_id: 4, edit_url: '/wp-admin/post.php?post=4' };
		};
		const contactTask = task( { id: 'add_contact_page', calypso_path: null } );
		const tailored: TailoredOutput = {
			...fixture,
			page_intros: { add_contact_page: 'Ask about a commission or a wholesale order.' },
		};

		await resolveCtaUrl( contactTask, tailored, handlers );
		const legacyUrl = await resolveCtaUrl( contactTask, fixture, handlers );

		assert.deepEqual( received, [ 'Ask about a commission or a wholesale order.', undefined ] );
		assert.equal( legacyUrl, '/wp-admin/post.php?post=4' );
	} );

	it( 'hands each page task its own intro when the output carries both', async () => {
		// The keyed lookup earns its shape only if a task reads its own key: an output where the model
		// chose both page tasks must not put the contact line on the events page, or vice versa.
		const received: Record< string, unknown[] > = { contact: [], events: [] };
		const { handlers } = stubHandlers();
		handlers.createContactPage = async ( intro?: string ) => {
			received.contact.push( intro );
			return { page_id: 4, edit_url: '/wp-admin/post.php?post=4' };
		};
		handlers.createEventsPage = async ( intro?: string ) => {
			received.events.push( intro );
			return { page_id: 5, edit_url: '/wp-admin/post.php?post=5' };
		};
		const tailored: TailoredOutput = {
			...fixture,
			page_intros: {
				add_contact_page: 'Ask about a commission.',
				add_events_page: 'Throw a pot with us on a Saturday morning.',
			},
		};

		await resolveCtaUrl(
			task( { id: 'add_contact_page', calypso_path: null } ),
			tailored,
			handlers
		);
		await resolveCtaUrl(
			task( { id: 'add_events_page', calypso_path: null } ),
			tailored,
			handlers
		);
		const legacyUrl = await resolveCtaUrl(
			task( { id: 'add_events_page', calypso_path: null } ),
			fixture,
			handlers
		);

		// The trailing undefined is the third call: an output with no page_intros at all, standing for
		// one persisted before the field existed and for a run where the model omitted it.
		assert.deepEqual( received, {
			contact: [ 'Ask about a commission.' ],
			events: [ 'Throw a pot with us on a Saturday morning.', undefined ],
		} );
		assert.equal( legacyUrl, '/wp-admin/post.php?post=5' );
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
		[ 'returns the first id when nothing is complete', 'a b', undefined, 'a' ],
		[ 'returns null when everything is complete', 'a! b!', undefined, null ],
		[ 'advances to the next incomplete task after the given id', 'a! b c', 'b', 'c' ],
		// Skipping the last incomplete task (b) leaves only a earlier in the list.
		[
			'wraps back to a remaining incomplete task when none follow the given id',
			'a b c!',
			'b',
			'a',
		],
		[ 'returns null when the given id was the only incomplete task', 'a! b!', 'b', null ],
		// The two disabled cards are passed over in favor of the first actionable one.
		[ 'skips disabled preview tasks as auto-expand targets', 'a~ b~ c', undefined, 'c' ],
		[ 'returns null when only disabled tasks remain', 'a! b~', undefined, null ],
	];

	for ( const [ name, spec, afterId, expected ] of CASES ) {
		it( name, () => assert.equal( nextIncompleteId( listOf( spec ), afterId ), expected ) );
	}
} );

describe( 'tasksFromFixture', () => {
	it( 'derives six incomplete tasks with humanized titles from the fixture', () => {
		const derived = tasksFromFixture( fixture );
		assert.equal( derived.length, 6 );
		assert.ok( derived.every( t => t.completed === false ) );
		assert.equal( derived[ 0 ].id, 'woo_products' );
		assert.equal( derived[ 0 ].title, 'Woo Products' );
		assert.equal( derived[ 0 ].subtitle, fixture.tasks[ 0 ].subtitle );
	} );
} );
