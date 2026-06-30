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
		{ id: 'woo_launch_site', subtitle: 'Launch the shop and start selling.' },
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
		// woo_launch_site has its own wc-admin deeplink, so it is not a launch kind.
		assert.equal( ctaKind( 'woo_launch_site' ), 'deeplink' );
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
