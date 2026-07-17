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
	trackWizardStepCompleted,
	trackWizardStepSkipped,
} from './tracks.ts';
import type { TailoredInferred } from './types.ts';

// tracks.ts touches window only inside record(), so a bare object is enough.
const win = globalThis as unknown as { window: { _tkq?: unknown[] } };

const NULL_CONTEXT = {
	goal: null,
	niche: null,
	theme_keyword: null,
	vibe: null,
	audience: null,
	rendered_list: null,
	inferred_goal: null,
};

const lastEvent = () => {
	const queue = win.window._tkq as unknown[];
	return queue[ queue.length - 1 ];
};

describe( 'ai-launchpad tracks', () => {
	beforeEach( () => {
		win.window = { _tkq: [] };
		resetTracksContext();
	} );

	it( 'records events with an all-null context by default and no launchpad_variant', () => {
		trackViewed( { step: 'goal' } );
		assert.deepEqual( lastEvent(), [
			'recordEvent',
			'jetpack_ai_launchpad_viewed',
			{ ...NULL_CONTEXT, step: 'goal' },
		] );
	} );

	it( 'merges the shared context into every event', () => {
		setTracksContext( { goal: 'write', niche: 'hiking' } );
		trackTaskCtaClicked( { task_id: 'site_theme_selected' } );
		assert.deepEqual( lastEvent(), [
			'recordEvent',
			'jetpack_ai_launchpad_task_cta_clicked',
			{ ...NULL_CONTEXT, goal: 'write', niche: 'hiking', task_id: 'site_theme_selected' },
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
			theme_keyword: 'hiking',
			inferred_goal: 'portfolio',
		} as TailoredInferred;
		assert.deepEqual( contextFromInferred( inferred ), {
			goal: 'write',
			niche: 'hiking',
			theme_keyword: 'hiking',
			vibe: null,
			audience: null,
			inferred_goal: 'portfolio',
		} );
	} );

	it( 'contextFromInferred handles a missing blob (all null)', () => {
		assert.deepEqual( contextFromInferred( undefined ), {
			goal: null,
			niche: null,
			theme_keyword: null,
			vibe: null,
			audience: null,
			inferred_goal: null,
		} );
	} );

	it( 'contextFromTaskIds stringifies the rendered list', () => {
		assert.deepEqual( contextFromTaskIds( [ 'a', 'b' ] ), {
			rendered_list: '["a","b"]',
		} );
	} );

	it( 'records the wizard funnel events with their props', () => {
		trackWizardGoalClicked( { goal_clicked: 'sell' } );
		assert.deepEqual( lastEvent(), [
			'recordEvent',
			'jetpack_ai_launchpad_wizard_goal_clicked',
			{ ...NULL_CONTEXT, goal_clicked: 'sell' },
		] );

		trackWizardStepCompleted( { step: 'goal' } );
		assert.deepEqual( lastEvent(), [
			'recordEvent',
			'jetpack_ai_launchpad_wizard_step_completed',
			{ ...NULL_CONTEXT, step: 'goal' },
		] );

		trackWizardStepSkipped( { step: 'site_details' } );
		assert.deepEqual( lastEvent(), [
			'recordEvent',
			'jetpack_ai_launchpad_wizard_step_skipped',
			{ ...NULL_CONTEXT, step: 'site_details' },
		] );

		trackWizardBackClicked();
		assert.deepEqual( lastEvent(), [
			'recordEvent',
			'jetpack_ai_launchpad_wizard_back_clicked',
			NULL_CONTEXT,
		] );
	} );

	it( 'records the task events with their task_id', () => {
		trackTaskClicked( { task_id: 'add_about_page', task_status: 'skipped' } );
		assert.deepEqual( lastEvent(), [
			'recordEvent',
			'jetpack_ai_launchpad_task_clicked',
			{ ...NULL_CONTEXT, task_id: 'add_about_page', task_status: 'skipped' },
		] );

		trackTaskSkipped( { task_id: 'add_about_page' } );
		assert.deepEqual( lastEvent(), [
			'recordEvent',
			'jetpack_ai_launchpad_task_skipped',
			{ ...NULL_CONTEXT, task_id: 'add_about_page' },
		] );
	} );

	it( 'initializes window._tkq when it is undefined', () => {
		win.window = {};
		trackViewed( { step: 'launchpad' } );
		assert.ok( Array.isArray( win.window._tkq ) );
		assert.equal( ( win.window._tkq as unknown[] ).length, 1 );
	} );
} );
