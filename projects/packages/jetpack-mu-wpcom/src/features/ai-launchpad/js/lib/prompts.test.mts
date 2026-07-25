import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildTailorPrompt, chooseTailoringMenu, TASK_ANNOTATIONS, TASK_MENU } from './prompts.ts';
import type { WizardInput } from './types.ts';

const __dirname = dirname( fileURLToPath( import.meta.url ) );
const CONTRACTS = resolve( __dirname, '../../contracts' );

const fixtures = JSON.parse( readFileSync( resolve( CONTRACTS, 'eval-fixtures.json' ), 'utf8' ) )
	.fixtures as Array< { name: string; input: WizardInput } >;

const INPUT: WizardInput = fixtures[ 0 ].input;

describe( 'TASK_ANNOTATIONS', () => {
	it( 'has no duplicate ids', () => {
		assert.equal( new Set( TASK_MENU ).size, TASK_MENU.length );
	} );

	it( 'gives every entry a non-empty what and pick when', () => {
		for ( const entry of TASK_ANNOTATIONS ) {
			assert.ok( entry.what.length > 0, `${ entry.id } is missing "what"` );
			assert.ok( entry.pickWhen.length > 0, `${ entry.id } is missing "pickWhen"` );
		}
	} );

	it( 'offers the foundation registry tasks to every goal', () => {
		// Both suit any site, so a goals line would be narrower than the (absent) PHP rule and would
		// suppress them for goals they are perfectly good on.
		for ( const id of [ 'add_site_icon', 'pick_fonts_colors' ] ) {
			const entry = TASK_ANNOTATIONS.find( annotation => annotation.id === id );
			assert.ok( entry, `${ id } must be on the menu` );
			assert.equal( entry.goals, undefined, `${ id } must carry no goal affinity` );
		}
	} );

	it( 'distinguishes the design-ish tasks from one another', () => {
		// The reason the model fell back to the same three: nothing in the menu said how they differ.
		// Each of these has to name a distinct surface, or a new alternative buys nothing.
		const byId = Object.fromEntries( TASK_ANNOTATIONS.map( entry => [ entry.id, entry ] ) );

		assert.match( byId.site_theme_selected.what, /theme showcase/i );
		assert.match( byId.design_edited.what, /Site Editor/i );
		assert.match( byId.front_page_updated.what, /homepage/i );
		assert.match( byId.pick_fonts_colors.what, /style variation/i );
		assert.match( byId.add_site_icon.what, /logo|icon/i );
	} );

	it( 'names the plugin in the discovery task and gives it no goal affinity', () => {
		// The pick is the personalization here, so the model has to be able to tell what the plugin is —
		// an entry that does not name it is the bare-id problem again. And the niche that decides (teaching
		// a structured course) is not what the goal slug tracks, so a goals line would suppress the task
		// for exactly the sites it exists to reach.
		const sensei = TASK_ANNOTATIONS.find( entry => entry.id === 'install_sensei_lms' );

		assert.ok( sensei, 'install_sensei_lms must be on the menu' );
		assert.match( sensei.what, /Sensei/ );
		assert.equal( sensei.goals, undefined );
	} );

	it( 'keeps the generic plugin task pointed at what no other task names', () => {
		// It is the only remaining route to the wider directory, so its pick when has to describe that role
		// rather than read as the leftover of a set of named-plugin tasks.
		const generic = TASK_ANNOTATIONS.find( entry => entry.id === 'install_custom_plugin' );

		assert.ok( generic, 'install_custom_plugin must be on the menu' );
		assert.match( generic.pickWhen, /no other task names it/ );
		assert.ok( generic.avoidWhen?.includes( 'install_sensei_lms' ) );
	} );

	it( 'makes the contact page distinguishable from the other page tasks', () => {
		// The menu already offers a generic "add a page" and a dedicated About page. An annotation that
		// does not separate this from both adds noise to the ranking instead of signal, which is the
		// bare-id problem in miniature.
		const byId = Object.fromEntries( TASK_ANNOTATIONS.map( entry => [ entry.id, entry ] ) );
		const contact = byId.add_contact_page;

		assert.ok( contact, 'add_contact_page must be on the menu' );
		assert.match( contact.what, /contact form/i );
		// About is about who is behind the site; contact is about someone needing a reply.
		assert.match( byId.add_about_page.pickWhen, /who is behind the site/i );
		assert.ok(
			contact.avoidWhen?.includes( 'add_about_page' ),
			'the contact entry must say when About is the better pick'
		);
		// The generic page task has to defer to it, or the model can spend the slot on an empty page.
		assert.match( byId.add_new_page.avoidWhen ?? '', /more specific page task/i );
		// No goal affinity: whether people need to reach someone is a property of the niche, not of the
		// wizard goal — a shop, a studio, a school and a B&B all need it and pick four different goals.
		assert.equal( contact.goals, undefined );
	} );

	it( 'makes the events page distinguishable from the other page tasks', () => {
		// Fourth page task on the menu, so the annotation has to separate it from the other three or the
		// model is picking between four things it cannot tell apart. The separator is a date people turn
		// up for: About says who is behind the site, contact opens a channel back, add_new_page defers.
		const byId = Object.fromEntries( TASK_ANNOTATIONS.map( entry => [ entry.id, entry ] ) );
		const events = byId.add_events_page;

		assert.ok( events, 'add_events_page must be on the menu' );
		assert.match( events.pickWhen, /date|when/i );
		// The blanks are the point, and the model has to know it is choosing a scaffold: the page it
		// creates is worth a slot only for a site that has real dates to put in it.
		assert.match( events.what, /blank|empty/i );
		assert.ok(
			events.avoidWhen?.includes( 'add_contact_page' ),
			'the events entry must say when a private arrangement makes contact the better pick'
		);
		// The generic page task has to defer to it, or the model can spend the slot on an empty page.
		assert.match( byId.add_new_page.avoidWhen ?? '', /more specific page task/i );
		// No goal affinity: running something on a date is a property of the niche, not of the wizard
		// goal — a yoga studio, a gallery, a band and a supper club pick four different goals.
		assert.equal( events.goals, undefined );
	} );

	it( 'makes the video page distinguishable from the gallery and the other page tasks', () => {
		// Fifth page task, and the one at most risk of collapsing into another: a gallery and a video
		// page are both "show the work", and the model will merge them unless the annotation makes the
		// medium the separator — still images you look at, video you watch. This is also the only entry
		// serving the video niche, since the round that dropped a VideoPress plugin-discovery task left
		// nothing else behind it.
		const byId = Object.fromEntries( TASK_ANNOTATIONS.map( entry => [ entry.id, entry ] ) );
		const video = byId.add_video_page;

		assert.ok( video, 'add_video_page must be on the menu' );
		assert.match( video.pickWhen, /watch/i );
		// The block arrives empty, and the model has to know it is spending a slot on a page the user
		// has to bring a video to.
		assert.match( video.what, /empty|blank/i );
		assert.ok(
			video.avoidWhen?.includes( 'add_gallery_page' ),
			'the video entry must say when still images make the gallery the better pick'
		);
		// The generic page task has to defer to it, or the model can spend the slot on an empty page.
		assert.match( byId.add_new_page.avoidWhen ?? '', /more specific page task/i );
		// No goal affinity, for the same reason the gallery has none: a vlogger, a music teacher and a
		// dance company pick three different goals, and suppressing the task by goal would lose exactly
		// the sites it exists for.
		assert.equal( video.goals, undefined );
	} );

	it( 'makes the portfolio piece distinguishable from the gallery and from the first post', () => {
		// Sixth page task, and the one that has to earn its slot against two tasks already on the menu.
		// Against add_gallery_page: a gallery is many images and no words, judged by looking; a piece is
		// one project and the words about it — what it was, who it was for, what the user did. Against
		// first_post_published: that publishes a dated post into the feed with AI-written prose already
		// in it; this creates a permanent page with no prose at all, because a project write-up is facts
		// only the user has. If the annotation does not carry both separators the model cannot act on
		// either, and a task the model merges into another is noise on the menu.
		const byId = Object.fromEntries( TASK_ANNOTATIONS.map( entry => [ entry.id, entry ] ) );
		const piece = byId.add_portfolio_piece;

		assert.ok( piece, 'add_portfolio_piece must be on the menu' );
		// One project, not a body of work: the singular is the whole distinction from the gallery.
		assert.match( piece.pickWhen, /one|single|individual/i );
		// The page arrives blank, and the model has to know it is spending a slot on a page the user has
		// to bring both the image and the story to.
		assert.match( piece.what, /blank|empty/i );
		assert.ok(
			piece.avoidWhen?.includes( 'add_gallery_page' ),
			'the piece entry must say when a set of images makes the gallery the better pick'
		);
		assert.ok(
			piece.what.includes( 'first_post_published' ) ||
				piece.avoidWhen?.includes( 'first_post_published' ),
			'the piece entry must separate itself from the AI-drafted first post'
		);
		// The generic page task has to defer to it, or the model can spend the slot on an empty page.
		assert.match( byId.add_new_page.avoidWhen ?? '', /more specific page task/i );
		// No goal affinity, for the same reason the gallery has none. `portfolio` looks like the obvious
		// hint and is the trap: a copywriter with case studies picks `write`, a studio picks `build`, and
		// a maker selling commissions picks `sell`. Hinting one goal suppresses the task for the others.
		assert.equal( piece.goals, undefined );
	} );

	it( 'offers the gallery task and gives it no goal affinity', () => {
		const gallery = TASK_ANNOTATIONS.find( entry => entry.id === 'add_gallery_page' );

		assert.ok( gallery, 'add_gallery_page must be on the menu' );
		// A goal affinity would suppress the gallery for the sites it exists to reach: a photographer or food
		// blogger picks `write`. Whether the site is visual is the criterion, and pickWhen carries it.
		assert.equal( gallery.goals, undefined );
	} );
} );

describe( 'buildTailorPrompt', () => {
	for ( const fixture of fixtures ) {
		it( `interpolates goal, site_name, and description for "${ fixture.name }"`, () => {
			const prompt = buildTailorPrompt( fixture.input );
			assert.ok( prompt.includes( fixture.input.goal ), 'goal missing from prompt' );
			assert.ok( prompt.includes( fixture.input.site_name ), 'site_name missing from prompt' );
			assert.ok( prompt.includes( fixture.input.description ), 'description missing from prompt' );
		} );
	}

	it( 'offers only the actionable theme task, not the legacy design tasks', () => {
		// design_selected is always-complete and design_completed has no wp-admin
		// completion path; both are consolidated onto site_theme_selected.
		assert.ok( TASK_MENU.includes( 'site_theme_selected' ) );
		assert.ok( ! TASK_MENU.includes( 'design_selected' ) );
		assert.ok( ! TASK_MENU.includes( 'design_completed' ) );
	} );

	it( 'renders each offered task as an annotated block, not a bare id', () => {
		const prompt = buildTailorPrompt( INPUT, [ 'first_post_published', 'site_launched' ] );

		assert.match( prompt, /- id: first_post_published\n {2}what: .+\n {2}pick when: .+/ );
	} );

	it( 'restricts the offered menu to the available tasks when given', () => {
		const available = [ 'first_post_published', 'site_theme_selected', 'site_launched' ];
		const prompt = buildTailorPrompt( INPUT, available );
		// A menu section lists only the available ids...
		for ( const id of available ) {
			assert.ok( prompt.includes( '- id: ' + id ), `available ID "${ id }" missing from menu` );
		}
		// ...and a menu-only task that is not available is dropped from the list.
		const dropped = TASK_MENU.find( id => ! available.includes( id ) ) as string;
		assert.ok(
			! prompt.includes( '- id: ' + dropped ),
			`unavailable ID "${ dropped }" should be dropped`
		);
	} );

	it( 'falls back to the full menu when availability is unknown', () => {
		const prompt = buildTailorPrompt( INPUT, [] );

		for ( const id of TASK_MENU ) {
			assert.ok( prompt.includes( `- id: ${ id }` ), `${ id } missing from full menu` );
		}
	} );

	it( 'renders optional fields only when present', () => {
		const withAvoid = TASK_ANNOTATIONS.find( entry => entry.avoidWhen );
		const withoutAvoid = TASK_ANNOTATIONS.find( entry => ! entry.avoidWhen );
		assert.ok( withAvoid && withoutAvoid, 'table needs both shapes to exercise this' );

		const prompt = buildTailorPrompt( INPUT, [ withAvoid.id, withoutAvoid.id ] );
		const blocks = prompt.split( '- id: ' );
		const plainBlock = blocks.find( block => block.startsWith( `${ withoutAvoid.id }\n` ) );

		assert.ok( prompt.includes( `  avoid when: ${ withAvoid.avoidWhen }` ) );
		assert.ok( plainBlock && ! plainBlock.includes( 'avoid when:' ) );
	} );

	it( 'no longer carries the goal rules that PHP now enforces', () => {
		const prompt = buildTailorPrompt( INPUT, [] );

		assert.ok( ! prompt.includes( 'if the goal is sell OR' ) );
		assert.ok( ! prompt.includes( 'if the goal is newsletter OR' ) );
		assert.ok( ! prompt.includes( 'order the commerce tasks store-first' ) );
	} );

	it( 'lists only server-enforced rules under the HARD RULES header', () => {
		// The header promises the model that violations are rejected, so an unenforced rule here claims
		// an authority the code does not back. Pinned to the exact strings, not just the count: swapping
		// an enforced rule for a demoted one keeps the count at four and would otherwise pass.
		//
		// The first rule points at the menu but promises only what update_tailored() actually checks:
		// that the server can build the id, from the shared catalog or from its own registry. An id
		// from either that the menu filter left off is still accepted.
		const prompt = buildTailorPrompt( INPUT, [] );
		const block = prompt.slice( prompt.indexOf( 'HARD RULES' ) ).split( '\n\n' )[ 0 ];
		const bullets = block.split( '\n' ).filter( line => line.startsWith( '- ' ) );

		assert.deepEqual( bullets, [
			'- Every "id" MUST be copied verbatim from the menu below. Never invent IDs: the server drops any id it cannot recognize, and rejects the whole list if too few tasks survive.',
			'- Return exactly 6 tasks.',
			'- The 6th and final task MUST be a launch task: "site_launched" (canonical) or "blog_launched".',
			'- Subtitles must be plain text: no URLs, no HTML, and no template syntax such as {{ }} or [[ ]].',
		] );
	} );

	it( 'offers the actionable ids while enough of them remain on the menu', () => {
		const actionable = TASK_MENU.slice( 0, 12 );
		const renderable = [ ...actionable, 'first_post_published_extra' ];
		assert.equal( chooseTailoringMenu( actionable, renderable ), actionable );
	} );

	it( 'relaxes to the renderable ids when completion leaves too few actionable menu tasks', () => {
		// Ids off the menu do not count toward the threshold: the prompt's menu is the intersection.
		const actionable = [ ...TASK_MENU.slice( 0, 4 ), 'off_menu_task_a', 'off_menu_task_b' ];
		const renderable = TASK_MENU.slice( 0, 20 );
		assert.equal( chooseTailoringMenu( actionable, renderable ), renderable );
	} );

	// Instructions the rest of the pipeline depends on; each needle is the load-bearing part.
	const REQUIRED: Array< [ string, Array< string | RegExp > ] > = [
		[ 'instructs the model to return only JSON', [ /return only a json object/i ] ],
		// inferred_goal is analytics-only, so the prompt must also tell the model to keep it out
		// of its task selection.
		[
			'asks for a diagnostic inferred_goal that must not influence the output',
			[ '"inferred_goal"', /must NOT influence/ ],
		],
		// The full slug menu must be in the prompt, and the instruction must steer the model
		// toward the specific subject over the generic goal bucket.
		[
			'asks for a theme_category chosen from the showcase subject slugs',
			[ '"theme_category"', 'travel-lifestyle', 'community-non-profit', /specific subject/i ],
		],
		// page_intros is keyed by task id and written only for a page task that was actually chosen,
		// so the prompt has to say both things: which key, and that it is conditional on the pick.
		[
			'asks for a conditional page intro keyed by the task id it belongs to',
			[ '"page_intros"', '"add_contact_page"', /only .*chose|chose none/i ],
		],
		// The whole reason this page is hand-authored: a confident, invented address or phone number
		// on a real business's contact page is worse than none at all.
		[
			'forbids the model inventing contact details the site never gave it',
			[ /never invent one/i, /phone/i ],
		],
		// The events page keeps its own key, and the same prohibition for the same reason: only the
		// user knows when their events are, and the page leaves those blanks blank on purpose.
		[
			'asks for an events-page intro that states no date, venue or price',
			[ '"add_events_page"', /do not (put|name) a date/i, /venue|address/i ],
		],
		// The video page's own key, and its own prohibition. The page holds one empty block, so an
		// intro that describes a particular video promises something the page does not have; and this
		// is an Automattic surface, so the line must not send visitors off to a video platform either.
		// Matched as one line rather than as three loose needles: the key and its prohibitions have to be
		// on the same STEP 5 bullet, or the model is either told to write a key the schema will reject or
		// handed a key with no rules attached.
		[
			'asks for a video-page intro that describes no particular video and names no platform',
			[ /^- "add_video_page": .*specific video.*platform or channel/m ],
		],
		// The gallery page's own key, and its own prohibitions, for the reason its page is now
		// hand-authored at all: the block it ships is empty, so an intro that describes particular
		// pictures promises images the page does not have — and the images it used to ship were
		// somebody else's. Matched as one line, like the video bullet, so the key and its rules cannot
		// drift onto separate bullets.
		[
			'asks for a gallery-page intro that describes no particular picture and names no platform',
			[ /^- "add_gallery_page": .*particular image.*platform or account/m ],
		],
	];
	for ( const [ name, needles ] of REQUIRED ) {
		it( name, () => {
			const prompt = buildTailorPrompt( INPUT );
			for ( const needle of needles ) {
				const found =
					typeof needle === 'string' ? prompt.includes( needle ) : needle.test( prompt );
				assert.ok( found, `missing from prompt: ${ needle }` );
			}
		} );
	}
} );
