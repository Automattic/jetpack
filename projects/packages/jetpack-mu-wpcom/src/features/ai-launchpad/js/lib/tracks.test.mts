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
		ref: 'experiment_wpcom_launchpad_personalization_202607_v1',
		site_type: 'simple',
		agent_name: 'ai_launchpad',
		agent_version: '6.10.1',
		// Strings, not booleans: the two recorders' encoders disagree on how a bool
		// serializes (http_build_query() → "1"/"0", encodeURIComponent() → "true"/"false"), so
		// the server sends the literal strings both pass through unchanged. See
		// wpcom_ai_launchpad_standard_props().
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

	// Each recorder must land on the queue as [ 'recordEvent', name, props ] carrying its own
	// props plus the standard ones. No shared context is set for these cases, so they also pin
	// the null-key omission: a leaked context key would show up as a literal "null" string.
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

	it( "keeps is_test 'false' rather than dropping it", () => {
		trackWizardCompleted();
		assert.equal( lastProps().is_test, 'false' );
		assert.equal( lastProps().blog_id, 12345 );
	} );

	it( 'reports the tailoring-scoped props as none before a tailor runs', () => {
		trackViewed( { step: 'goal' } );
		assert.equal( lastProps().source, 'none' );
		assert.equal( lastProps().outcome, 'none' );
		assert.equal( lastProps().ai_session_id, 'none' );
	} );

	it( 'lets a fresh tailor override the tailoring-scoped props', () => {
		setTracksContext(
			contextFromTailorResult( 'fallback', 'a755f9e8-8e0a-45be-81bc-524aaf8e2703' )
		);
		trackTaskCtaClicked( { task_id: 'site_theme_selected' } );
		assert.equal( lastProps().source, 'fallback' );
		assert.equal( lastProps().outcome, 'error' );
		assert.equal( lastProps().ai_session_id, 'a755f9e8-8e0a-45be-81bc-524aaf8e2703' );
	} );

	it( 'contextFromTailorResult maps an AI result to a success outcome', () => {
		assert.deepEqual( contextFromTailorResult( 'ai', 'abc' ), {
			source: 'ai',
			outcome: 'success',
			ai_session_id: 'abc',
		} );
	} );

	// An unmintable id must not be recorded as an empty string: the server never persisted it
	// either, so leaving it null keeps both recorders reporting the bootstrap's 'none'.
	it( 'contextFromTailorResult nulls an unminted session id', () => {
		assert.deepEqual( contextFromTailorResult( 'fallback', '' ), {
			source: 'fallback',
			outcome: 'error',
			ai_session_id: null,
		} );
	} );

	it( 'records none, not an empty id, when the session id could not be minted', () => {
		setTracksContext( contextFromTailorResult( 'fallback', '' ) );
		trackTaskCtaClicked( { task_id: 'site_theme_selected' } );
		assert.equal( lastProps().ai_session_id, 'none' );
		assert.equal( lastProps().source, 'fallback' );
	} );

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

	it( 'contextFromInferred maps fields and coalesces missing ones to null', () => {
		const inferred = {
			goal: 'write',
			niche: 'hiking',
			theme_category: 'travel-lifestyle',
			inferred_goal: 'portfolio',
		} as TailoredInferred;
		assert.deepEqual( contextFromInferred( inferred ), {
			goal: 'write',
			niche: 'hiking',
			theme_category: 'travel-lifestyle',
			vibe: null,
			audience: null,
			inferred_goal: 'portfolio',
		} );
	} );

	it( 'contextFromInferred handles a missing blob (all null)', () => {
		assert.deepEqual( contextFromInferred( undefined ), {
			goal: null,
			niche: null,
			theme_category: null,
			vibe: null,
			audience: null,
			inferred_goal: null,
		} );
	} );

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
