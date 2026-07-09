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
import type { EnrichedTask } from './model.ts';
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
			'Every piece at Terra Ceramics starts as a lump of clay and a quiet morning at the wheel. We make small-batch mugs, bowls, and vases meant for daily use, each one carrying the marks of the hands that shaped it.',
			'Browse the shop to find a piece that fits your table, or follow along here as we share new collections, studio notes, and the slow craft behind every glaze.',
		],
	},
};

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
	it( 'routes the first-post tasks to the post draft handler', () => {
		assert.equal( ctaKind( 'first_post_published' ), 'first_post' );
		assert.equal( ctaKind( 'first_post_published_newsletter' ), 'first_post' );
	} );

	it( 'routes page-creating tasks to the pattern page handler', () => {
		assert.equal( ctaKind( 'add_about_page' ), 'pattern_page' );
	} );

	it( 'routes pathless launch tasks to the launch handler', () => {
		assert.equal( ctaKind( 'site_launched' ), 'launch' );
		assert.equal( ctaKind( 'blog_launched' ), 'launch' );
		assert.equal( ctaKind( 'link_in_bio_launched' ), 'launch' );
	} );

	it( 'routes everything else to a deeplink', () => {
		assert.equal( ctaKind( 'site_theme_selected' ), 'deeplink' );
		// woo_launch_site is dropped server-side (remapped to site_launched), but guard the client too: were a stray
		// one to reach here it must not be treated as a launch task.
		assert.equal( ctaKind( 'woo_launch_site' ), 'deeplink' );
		// The synthetic store tasks navigate to their wp-admin CTAs.
		assert.equal( ctaKind( 'install_woocommerce' ), 'deeplink' );
		assert.equal( ctaKind( 'setup_woocommerce_store' ), 'deeplink' );
	} );
} );

describe( 'ctaKind gallery', () => {
	it( 'routes add_gallery_page through the pattern-page flow', () => {
		assert.equal( ctaKind( 'add_gallery_page' ), 'pattern_page' );
	} );
} );

describe( 'toNavigableUrl', () => {
	it( 'pins Calypso router paths to wordpress.com', () => {
		assert.equal(
			toNavigableUrl( '/me#complete-your-profile' ),
			'https://wordpress.com/me#complete-your-profile'
		);
		assert.equal(
			toNavigableUrl( '/marketing/connections/example.com' ),
			'https://wordpress.com/marketing/connections/example.com'
		);
	} );

	it( 'leaves site-relative wp-admin paths untouched', () => {
		assert.equal( toNavigableUrl( '/wp-admin/post.php?post=1' ), '/wp-admin/post.php?post=1' );
		// The root wp-admin path, with or without a query/hash, is still site-relative.
		assert.equal( toNavigableUrl( '/wp-admin' ), '/wp-admin' );
		assert.equal( toNavigableUrl( '/wp-admin/' ), '/wp-admin/' );
		assert.equal( toNavigableUrl( '/wp-admin?foo=bar' ), '/wp-admin?foo=bar' );
	} );

	it( 'leaves absolute URLs untouched', () => {
		assert.equal(
			toNavigableUrl( 'https://example.com/wp-admin/admin.php?page=wc-admin' ),
			'https://example.com/wp-admin/admin.php?page=wc-admin'
		);
		assert.equal(
			toNavigableUrl( 'https://connect.stripe.com/x' ),
			'https://connect.stripe.com/x'
		);
	} );
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
	it( 'treats a launch task as actionable only when the site URL is known', () => {
		const launch = task( { id: 'site_launched', calypso_path: null } );
		assert.equal( isTaskActionable( launch, null, 'https://example.com' ), true );
		assert.equal( isTaskActionable( launch, null, null ), false );
		// An empty or malformed URL can't build a launch URL, so it must not be
		// actionable (stays in lockstep with resolveCtaUrl).
		assert.equal( isTaskActionable( launch, null, '' ), false );
		assert.equal( isTaskActionable( launch, null, 'not-a-url' ), false );
	} );

	it( 'treats an in-progress task as actionable when it has a draft to reopen', () => {
		// No AI output: a not-in-progress create-content task would be non-actionable,
		// so this proves the in-progress reopen path is what makes it actionable.
		assert.equal(
			isTaskActionable(
				task( {
					id: 'add_about_page',
					in_progress: true,
					calypso_path: '/wp-admin/post.php?post=9',
				} ),
				null
			),
			true
		);
		// Flagged in progress but with no draft path there is nothing to reopen.
		assert.equal(
			isTaskActionable(
				task( { id: 'add_about_page', in_progress: true, calypso_path: null } ),
				null
			),
			false
		);
	} );

	it( 'is never actionable for a disabled preview task', () => {
		// Even with an otherwise-actionable shape, disabled short-circuits to false.
		assert.equal(
			isTaskActionable(
				task( { id: 'woo_products', disabled: true, calypso_path: '/themes/example.com' } ),
				null
			),
			false
		);
	} );
} );

describe( 'isCompleteOnClickTask', () => {
	it( 'is true for acknowledgment tasks with no Atomic completion signal', () => {
		assert.equal( isCompleteOnClickTask( 'complete_profile' ), true );
		assert.equal( isCompleteOnClickTask( 'earn_money' ), true );
		assert.equal( isCompleteOnClickTask( 'site_monitoring_page' ), true );
		assert.equal( isCompleteOnClickTask( 'setup_ssh' ), true );
		assert.equal( isCompleteOnClickTask( 'share_site' ), true );
	} );

	it( 'is false for tasks that complete via a real signal or listener', () => {
		assert.equal( isCompleteOnClickTask( 'first_post_published' ), false );
		assert.equal( isCompleteOnClickTask( 'site_theme_selected' ), false );
		assert.equal( isCompleteOnClickTask( 'woo_products' ), false );
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
				trackTaskClicked: ( props: { task_id: string } ) => clicked.push( props.task_id ),
				createFirstPostDraft: async () => ( { post_id: 1, edit_url: '/wp-admin/post.php?post=1' } ),
				createPatternPage: async () => ( { page_id: 2, edit_url: '/wp-admin/post.php?post=2' } ),
			},
		};
	}

	it( 'fires the Tracks event with the clicked task ID and deeplinks for plain tasks', async () => {
		const { clicked, handlers } = stubHandlers();
		const url = await resolveCtaUrl(
			task( { id: 'site_theme_selected', calypso_path: '/themes/x' } ),
			null,
			handlers
		);
		// A Calypso router path is pinned to wordpress.com (it must not resolve
		// against the site host where the launchpad runs).
		assert.equal( url, 'https://wordpress.com/themes/x' );
		assert.deepEqual( clicked, [ 'site_theme_selected' ] );
	} );

	it( 'passes absolute deeplinks (admin_url / Stripe) through unchanged', async () => {
		const { handlers } = stubHandlers();
		const stripe = await resolveCtaUrl(
			task( { id: 'stripe_connected', calypso_path: 'https://connect.stripe.com/setup/x' } ),
			null,
			handlers
		);
		assert.equal( stripe, 'https://connect.stripe.com/setup/x' );

		const admin = await resolveCtaUrl(
			task( {
				id: 'woo_products',
				calypso_path: 'https://example.com/wp-admin/admin.php?page=wc-admin&task=products',
			} ),
			null,
			handlers
		);
		assert.equal( admin, 'https://example.com/wp-admin/admin.php?page=wc-admin&task=products' );
	} );

	it( 'drafts a post and returns its editor URL for first-creation tasks', async () => {
		const { clicked, handlers } = stubHandlers();
		const url = await resolveCtaUrl(
			task( { id: 'first_post_published', calypso_path: null } ),
			fixture,
			handlers
		);
		assert.equal( url, '/wp-admin/post.php?post=1' );
		assert.deepEqual( clicked, [ 'first_post_published' ] );
	} );

	it( 'builds a pattern page and returns its editor URL for page tasks', async () => {
		const { clicked, handlers } = stubHandlers();
		const url = await resolveCtaUrl(
			task( { id: 'add_about_page', calypso_path: null } ),
			fixture,
			handlers
		);
		assert.equal( url, '/wp-admin/post.php?post=2' );
		assert.deepEqual( clicked, [ 'add_about_page' ] );
	} );

	it( 'passes the pattern variant keyed by task id', async () => {
		const variants: ( string | undefined )[] = [];
		const handlers = {
			trackTaskClicked: () => {},
			createFirstPostDraft: async () => ( { post_id: 1, edit_url: '/wp-admin/post.php?post=1' } ),
			createPatternPage: async ( _inferred: TailoredOutput[ 'inferred' ], variant?: string ) => {
				variants.push( variant );
				return { page_id: 2, edit_url: '/wp-admin/post.php?post=2' };
			},
		};

		await resolveCtaUrl(
			task( { id: 'add_gallery_page', calypso_path: null } ),
			fixture,
			handlers
		);
		await resolveCtaUrl( task( { id: 'add_about_page', calypso_path: null } ), fixture, handlers );

		assert.deepEqual( variants, [ 'gallery', 'about' ] );
	} );

	it( 'reopens the existing draft for an in-progress task instead of creating a new one', async () => {
		const { clicked, handlers } = stubHandlers();
		// The create-page handler would return .../post=2; reopening the draft returns .../post=9.
		const aboutPage = await resolveCtaUrl(
			task( {
				id: 'add_about_page',
				in_progress: true,
				calypso_path: 'https://example.com/wp-admin/post.php?post=9&action=edit',
			} ),
			fixture,
			handlers
		);
		assert.equal( aboutPage, 'https://example.com/wp-admin/post.php?post=9&action=edit' );

		// The first-post task reopens its draft too, rather than drafting a fresh post (.../post=1).
		const firstPost = await resolveCtaUrl(
			task( {
				id: 'first_post_published',
				in_progress: true,
				calypso_path: 'https://example.com/wp-admin/post.php?post=7&action=edit',
			} ),
			fixture,
			handlers
		);
		assert.equal( firstPost, 'https://example.com/wp-admin/post.php?post=7&action=edit' );
		assert.deepEqual( clicked, [ 'add_about_page', 'first_post_published' ] );
	} );

	it( 'sends launch tasks to the wordpress.com launch flow built from the site URL', async () => {
		const { clicked, handlers } = stubHandlers();
		const url = await resolveCtaUrl(
			task( { id: 'site_launched', calypso_path: null } ),
			null,
			handlers,
			'https://example.wpcomstaging.com'
		);
		assert.equal(
			url,
			'https://wordpress.com/start/launch-site?siteSlug=example.wpcomstaging.com&ref=wp-admin'
		);
		assert.deepEqual( clicked, [ 'site_launched' ] );
	} );

	it( 'returns null for a launch task when the site URL is unavailable', async () => {
		const { handlers } = stubHandlers();
		const url = await resolveCtaUrl(
			task( { id: 'site_launched', calypso_path: null } ),
			null,
			handlers,
			null
		);
		assert.equal( url, null );
	} );
} );

describe( 'nextIncompleteId', () => {
	it( 'returns the first incomplete task id', () => {
		const tasks = [
			task( { id: 'a', completed: true } ),
			task( { id: 'b', completed: false } ),
			task( { id: 'c', completed: false } ),
		];
		assert.equal( nextIncompleteId( tasks ), 'b' );
	} );

	it( 'returns the first id when nothing is complete', () => {
		const tasks = [ task( { id: 'a' } ), task( { id: 'b' } ) ];
		assert.equal( nextIncompleteId( tasks ), 'a' );
	} );

	it( 'returns null when everything is complete', () => {
		const tasks = [ task( { id: 'a', completed: true } ), task( { id: 'b', completed: true } ) ];
		assert.equal( nextIncompleteId( tasks ), null );
	} );

	it( 'advances to the next incomplete task after the given id', () => {
		const tasks = [
			task( { id: 'a', completed: true } ),
			task( { id: 'b', completed: false } ),
			task( { id: 'c', completed: false } ),
		];
		assert.equal( nextIncompleteId( tasks, 'b' ), 'c' );
	} );

	it( 'wraps back to a remaining incomplete task when none follow the given id', () => {
		const tasks = [
			task( { id: 'a', completed: false } ),
			task( { id: 'b', completed: false } ),
			task( { id: 'c', completed: true } ),
		];
		// Skipping the last incomplete task (b) leaves only a earlier in the list.
		assert.equal( nextIncompleteId( tasks, 'b' ), 'a' );
	} );

	it( 'returns null when the given id was the only incomplete task', () => {
		const tasks = [ task( { id: 'a', completed: true } ), task( { id: 'b', completed: true } ) ];
		assert.equal( nextIncompleteId( tasks, 'b' ), null );
	} );

	it( 'skips disabled preview tasks as auto-expand targets', () => {
		const tasks = [
			task( { id: 'a', disabled: true } ),
			task( { id: 'b', disabled: true } ),
			task( { id: 'c', completed: false } ),
		];
		// The two disabled cards are passed over in favor of the first actionable one.
		assert.equal( nextIncompleteId( tasks ), 'c' );
	} );

	it( 'returns null when only disabled tasks remain', () => {
		const tasks = [ task( { id: 'a', completed: true } ), task( { id: 'b', disabled: true } ) ];
		assert.equal( nextIncompleteId( tasks ), null );
	} );
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
