import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import {
	contextFromInferred,
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
const win = globalThis as unknown as { window: { _tkq?: unknown[] } };

const lastEvent = () => {
	const queue = win.window._tkq as unknown[];
	return queue[ queue.length - 1 ];
};

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
		win.window = { _tkq: [] };
		resetTracksContext();
	} );

	// Each recorder must land on the queue as [ 'recordEvent', name, props ] carrying exactly
	// the props it was given. No shared context is set for these cases, so they also pin the
	// null-key omission: a leaked context key would show up as a literal "null" string, and
	// launchpad_variant (dropped from the schema) would show up at all.
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
		it( `records jetpack_ai_launchpad_${ event } with exactly its own props`, () => {
			const props = fired();
			assert.deepEqual( lastEvent(), [ 'recordEvent', `jetpack_ai_launchpad_${ event }`, props ] );
		} );
	}

	it( 'merges the shared context into every event', () => {
		setTracksContext( { goal: 'write', niche: 'hiking' } );
		trackTaskCtaClicked( { task_id: 'site_theme_selected' } );
		assert.deepEqual( lastEvent(), [
			'recordEvent',
			'jetpack_ai_launchpad_task_cta_clicked',
			{ goal: 'write', niche: 'hiking', task_id: 'site_theme_selected' },
		] );
	} );

	it( 'later setTracksContext calls override earlier values and keep the rest', () => {
		setTracksContext( { goal: 'write', vibe: 'warm' } );
		setTracksContext( { goal: 'sell' } );
		trackWizardCompleted();
		const [ , , props ] = lastEvent() as [ string, string, Record< string, unknown > ];
		assert.equal( props.goal, 'sell' );
		assert.equal( props.vibe, 'warm' );
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
		assert.equal( ( win.window._tkq as unknown[] ).length, 1 );
	} );

	it( 'initializes window._tkq when it is undefined', () => {
		win.window = {};
		trackViewed( { step: 'launchpad' } );
		assert.ok( Array.isArray( win.window._tkq ) );
		assert.equal( ( win.window._tkq as unknown[] ).length, 1 );
	} );
} );
