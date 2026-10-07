import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import {
	contextFromInferred,
	contextFromTailorResult,
	contextFromTaskIds,
	resetTracksContext,
	setTracksContext,
	trackTaskClicked,
	trackTaskCtaClicked,
	trackTaskSkipped,
	trackViewed,
	trackWizardBackClicked,
	trackWizardCompleted,
	trackWizardGoalClicked,
	trackWizardSiteDetailsChanged,
	trackWizardStepCompleted,
	trackWizardStepSkipped,
} from './tracks.ts';
import type { TailoredInferred, TrackEventProps } from './types.ts';

// tracks.ts touches window only inside record(), so a bare object is enough.
const win = globalThis as unknown as {
	window: { _tkq?: unknown[]; wpcomAiLaunchpadTracks?: unknown };
};

// What the page's inline script sets, minus the values that vary by site.
const BOOTSTRAP = {
	props: {
		channel: 'web',
		surface: 'dashboard',
		screen: 'admin.php',
		ref: 'ai_launchpad',
		site_type: 'simple',
		agent_name: 'ai_launchpad',
		agent_version: '6.10.1',
		// Strings, not booleans: see wpcom_ai_launchpad_standard_props().
		is_test: 'false',
		is_a11n: 'false',
		blog_id: 12345,
		source: 'none',
		outcome: 'none',
		ai_session_id: 'none',
	},
	identity: null,
};

const events = () => win.window._tkq as unknown[];
const lastEvent = () => events()[ events().length - 1 ];
const lastProps = () => ( lastEvent() as [ string, string, TrackEventProps ] )[ 2 ];

/**
 * Bind a recorder to the props it should record, for the table below.
 *
 * @param record - The recorder under test.
 * @param props  - The props to call it with.
 * @return A thunk that records and returns the props it passed.
 */
function fire< P extends TrackEventProps >( record: ( props: P ) => void, props: P ) {
	return () => {
		record( props );
		return props as TrackEventProps;
	};
}

describe( 'ai-launchpad tracks', () => {
	beforeEach( () => {
		win.window = { _tkq: [], wpcomAiLaunchpadTracks: structuredClone( BOOTSTRAP ) };
		resetTracksContext();
	} );

	// The context is all null here, so these also pin that null keys never override the bootstrap.
	const RECORDERS: Array< [ event: string, fired: () => TrackEventProps ] > = [
		[ 'viewed', fire( trackViewed, { step: 'goal' } ) ],
		[ 'wizard_goal_clicked', fire( trackWizardGoalClicked, { goal_clicked: 'sell' } ) ],
		[ 'wizard_step_completed', fire( trackWizardStepCompleted, { step: 'goal' } ) ],
		[ 'wizard_step_skipped', fire( trackWizardStepSkipped, { step: 'site_details' } ) ],
		[ 'wizard_back_clicked', fire( trackWizardBackClicked, { step: 'site_details' } ) ],
		[ 'wizard_site_details_changed', fire( trackWizardSiteDetailsChanged, { field: 'title' } ) ],
		[ 'wizard_completed', fire( trackWizardCompleted, {} ) ],
		[ 'task_clicked', fire( trackTaskClicked, { task_id: 'setup_ssh', task_status: 'skipped' } ) ],
		[ 'task_cta_clicked', fire( trackTaskCtaClicked, { task_id: 'site_theme_selected' } ) ],
		[ 'task_skipped', fire( trackTaskSkipped, { task_id: 'add_about_page' } ) ],
	];

	for ( const [ event, fired ] of RECORDERS ) {
		it( `records jetpack_ai_launchpad_${ event } with its own props and the standard ones`, () => {
			const props = fired();
			assert.deepEqual( lastEvent(), [
				'recordEvent',
				`jetpack_ai_launchpad_${ event }`,
				{ ...BOOTSTRAP.props, ...props },
			] );
		} );
	}

	it( 'lets a fresh tailor override the tailoring-scoped props', () => {
		setTracksContext(
			contextFromTailorResult( 'fallback', 'a755f9e8-8e0a-45be-81bc-524aaf8e2703' )
		);
		trackTaskCtaClicked( { task_id: 'site_theme_selected' } );
		assert.equal( lastProps().source, 'fallback' );
		assert.equal( lastProps().outcome, 'error' );
		assert.equal( lastProps().ai_session_id, 'a755f9e8-8e0a-45be-81bc-524aaf8e2703' );
	} );

	const TAILOR_RESULTS: Array< [ string, Parameters< typeof contextFromTailorResult >, object ] > =
		[
			[
				'maps an AI result to a success outcome',
				[ 'ai', 'abc' ],
				{ source: 'ai', outcome: 'success', ai_session_id: 'abc' },
			],
			// Null, not '', so the bootstrap's 'none' shows through for an id that was never minted.
			[
				'nulls an unminted session id',
				[ 'fallback', '' ],
				{ source: 'fallback', outcome: 'error', ai_session_id: null },
			],
		];
	for ( const [ name, args, expected ] of TAILOR_RESULTS ) {
		it( `contextFromTailorResult ${ name }`, () =>
			assert.deepEqual( contextFromTailorResult( ...args ), expected ) );
	}

	it( 'merges the shared context into every event', () => {
		setTracksContext( { goal: 'write', niche: 'hiking' } );
		trackTaskCtaClicked( { task_id: 'site_theme_selected' } );
		assert.deepEqual( lastEvent(), [
			'recordEvent',
			'jetpack_ai_launchpad_task_cta_clicked',
			{ ...BOOTSTRAP.props, goal: 'write', niche: 'hiking', task_id: 'site_theme_selected' },
		] );
	} );

	it( 'records nothing but the event when the bootstrap global is missing', () => {
		win.window = { _tkq: [] };
		trackViewed( { step: 'goal' } );
		assert.deepEqual( lastEvent(), [
			'recordEvent',
			'jetpack_ai_launchpad_viewed',
			{ step: 'goal' },
		] );
	} );

	it( 'pushes identifyUser once, before the first event, when an identity is present', () => {
		win.window = {
			_tkq: [],
			wpcomAiLaunchpadTracks: { ...BOOTSTRAP, identity: { userid: 7, username: 'copons' } },
		};
		trackViewed( { step: 'goal' } );
		trackWizardGoalClicked( { goal_clicked: 'sell' } );

		assert.deepEqual( events()[ 0 ], [ 'identifyUser', 7, 'copons' ] );
		assert.equal( events().filter( e => ( e as unknown[] )[ 0 ] === 'identifyUser' ).length, 1 );
		assert.equal( events().length, 3 );
	} );

	it( 'pushes no identifyUser when the identity is null', () => {
		trackViewed( { step: 'goal' } );
		assert.equal( events().length, 1 );
	} );

	it( 'later setTracksContext calls override earlier values and keep the rest', () => {
		setTracksContext( { goal: 'write', vibe: 'warm' } );
		setTracksContext( { goal: 'sell' } );
		trackWizardCompleted();
		assert.equal( lastProps().goal, 'sell' );
		assert.equal( lastProps().vibe, 'warm' );
	} );

	const INFERRED: Array< [ string, TailoredInferred | undefined, object ] > = [
		[
			'maps fields and coalesces missing ones to null',
			{
				goal: 'write',
				niche: 'hiking',
				theme_category: 'travel-lifestyle',
				inferred_goal: 'portfolio',
			} as TailoredInferred,
			{
				goal: 'write',
				niche: 'hiking',
				theme_category: 'travel-lifestyle',
				vibe: null,
				audience: null,
				inferred_goal: 'portfolio',
			},
		],
		[
			'handles a missing blob (all null)',
			undefined,
			{
				goal: null,
				niche: null,
				theme_category: null,
				vibe: null,
				audience: null,
				inferred_goal: null,
			},
		],
	];
	for ( const [ name, inferred, expected ] of INFERRED ) {
		it( `contextFromInferred ${ name }`, () =>
			assert.deepEqual( contextFromInferred( inferred ), expected ) );
	}

	it( 'contextFromTaskIds stringifies the rendered list', () => {
		assert.deepEqual( contextFromTaskIds( [ 'a', 'b' ] ), { rendered_list: '["a","b"]' } );
	} );

	it( 'latches wizard_completed to once per page load', () => {
		trackWizardCompleted();
		trackWizardCompleted();
		assert.equal( events().length, 1 );
	} );

	it( 'initializes window._tkq when it is undefined', () => {
		win.window = { wpcomAiLaunchpadTracks: structuredClone( BOOTSTRAP ) };
		trackViewed( { step: 'launchpad' } );
		assert.ok( Array.isArray( win.window._tkq ) );
		assert.equal( events().length, 1 );
	} );
} );
