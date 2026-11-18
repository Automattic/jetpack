import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	aiToolRowStatus,
	aiToolView,
	dashboardIntegration,
	BRING_YOUR_AI_TOOL,
	buildWizardPayload,
	canContinue,
	findNewConnections,
	firstScreen,
	footerExit,
	footerShowsDashboard,
	trackedVariation,
	isReadOnlyAccess,
	goalsVariation,
	isLastStep,
	mcpPollSchedule,
	pickPlaceholder,
	rewaitOnReturn,
	showsSetupChoice,
	viewedStep,
	type AiTool,
	type WizardState,
} from './lib.ts';

/**
 * Build a wizard state with sensible defaults.
 *
 * @param partial - Fields to override.
 * @return The wizard state.
 */
function stateWith( partial: Partial< WizardState > = {} ): WizardState {
	return { goal: null, siteName: '', intent: '', locale: 'en', uiLocale: 'en', ...partial };
}

describe( 'wizard step gating', () => {
	it( 'gates Continue on step 0 on a goal being selected', () => {
		assert.equal( canContinue( 0, stateWith() ), false );
		assert.equal( canContinue( 0, stateWith( { goal: 'write' } ) ), true );
	} );

	it( 'always allows submitting from the details step', () => {
		assert.equal( canContinue( 1, stateWith() ), true );
		assert.equal( canContinue( 1, stateWith( { goal: 'build' } ) ), true );
	} );

	it( 'treats only the final step as last', () => {
		assert.equal( isLastStep( 0 ), false );
		assert.equal( isLastStep( 1 ), true );
	} );
} );

describe( 'goals step experiment', () => {
	it( 'shows the setup choice in the treatment only', () => {
		assert.equal( showsSetupChoice( BRING_YOUR_AI_TOOL ), true );
		assert.equal( showsSetupChoice( 'control' ), false );
	} );

	it( 'renders control while unassigned, on error, and for an unknown variation', () => {
		for ( const variation of [ undefined, null, '', 'control', 'something_else' ] ) {
			assert.equal( goalsVariation( variation ), 'control' );
		}
		assert.equal( goalsVariation( 'bring_your_ai_tool' ), 'bring_your_ai_tool' );
	} );
} );

describe( 'opening on the AI tool view', () => {
	for ( const [ variation, startOnAiTool, screen ] of [
		[ BRING_YOUR_AI_TOOL, false, 'setup_choice' ],
		[ 'control', false, 'goal' ],
		[ 'control', true, 'ai_tool' ],
	] as const ) {
		it( `opens ${ variation } on ${ screen } when startOnAiTool is ${ startOnAiTool }`, () => {
			assert.equal( firstScreen( variation, startOnAiTool ), screen );
		} );
	}

	for ( const [ name, variation, choosing, showAiTool, startOnAiTool, hasBackUrl, exit ] of [
		[ 'control goals', 'control', false, false, false, false, 'skip' ],
		[ 'treatment setup choice', BRING_YOUR_AI_TOOL, true, false, false, false, 'skip' ],
		[ 'treatment goals', BRING_YOUR_AI_TOOL, false, false, false, false, 'back' ],
		[ 'treatment AI tool view', BRING_YOUR_AI_TOOL, false, true, false, false, 'back' ],
		[ 'AI tool view the URL opened, with a Back URL', 'control', false, true, true, true, 'back' ],
		[ 'AI tool view the URL opened, without one', 'control', false, true, true, false, null ],
	] as const ) {
		it( `offers ${ exit } on the ${ name }`, () => {
			assert.equal(
				footerExit( { variation, choosing, showAiTool, startOnAiTool, hasBackUrl } ),
				exit
			);
		} );
	}

	for ( const [ variation, startOnAiTool, tracked ] of [
		[ BRING_YOUR_AI_TOOL, false, BRING_YOUR_AI_TOOL ],
		[ 'control', true, null ],
	] as const ) {
		it( `tracks goals_variation ${ tracked } for ${ variation } when startOnAiTool is ${ startOnAiTool }`, () => {
			assert.equal( trackedVariation( variation, startOnAiTool ), tracked );
		} );
	}

	for ( const [ promptCopied, exit, shows ] of [
		[ false, 'back', false ],
		[ true, 'back', true ],
		[ false, null, true ],
	] as const ) {
		it( `shows Go to my dashboard: ${ shows } (copied ${ promptCopied }, exit ${ exit })`, () => {
			assert.equal( footerShowsDashboard( promptCopied, exit ), shows );
		} );
	}
} );

describe( 'waiting again on return to the tab', () => {
	for ( const [ readOnly, connected, timedOut, remote, tool ] of [
		[ true, [ 'chatgpt' ], null, false, 'chatgpt' ],
		[ false, [], 'claude', true, 'claude' ],
		[ false, [], 'claude', false, null ],
		[ false, [ 'claude' ], 'claude', true, null ],
		[ false, [], null, true, null ],
	] as const ) {
		it( `waits for ${ tool } (read-only ${ readOnly }, connected ${ connected.join( '+' ) || 'nothing' }, timed out ${ timedOut }, remote ${ remote })`, () => {
			assert.equal(
				rewaitOnReturn( {
					readOnly,
					connected: [ ...connected ],
					timedOut,
					pollsRemotely: remote,
				} ),
				tool
			);
		} );
	}
} );

describe( 'AI tool connection checks', () => {
	for ( const [ remote, schedule ] of [
		[ false, { intervalMs: 4000, whileHidden: true, onStart: false, onFocus: false } ],
		[ true, { intervalMs: 30000, whileHidden: false, onStart: true, onFocus: true } ],
	] as const ) {
		it( `checks every ${ schedule.intervalMs } ms, hidden tab ${ schedule.whileHidden }, on start and focus ${ schedule.onStart } (remote ${ remote })`, () => {
			assert.deepEqual( mcpPollSchedule( remote ), schedule );
		} );
	}
} );

describe( 'AI tool connection', () => {
	it( 'counts an existing connection to a clicked tool', () => {
		assert.deepEqual( findNewConnections( [ 'chatgpt' ], [ 'chatgpt' ], 'chatgpt', [] ), [
			'chatgpt',
		] );
	} );

	it( 'ignores tools the user never clicked Connect on, and unknown integrations', () => {
		assert.deepEqual(
			findNewConnections( [ 'claude', 'cursor' ], [ 'chatgpt' ], 'chatgpt', [] ),
			[]
		);
		assert.deepEqual( findNewConnections( [], [ 'chatgpt' ], 'chatgpt', [] ), [] );
	} );

	it( 'returns every clicked tool that connected, the most recently clicked last', () => {
		const connections = [ 'chatgpt', 'claude' ];
		const clicked: AiTool[] = [ 'chatgpt', 'claude' ];
		assert.deepEqual( findNewConnections( connections, clicked, 'claude', [] ), [
			'chatgpt',
			'claude',
		] );
		assert.deepEqual( findNewConnections( connections, clicked, 'chatgpt', [] ), [
			'claude',
			'chatgpt',
		] );
	} );

	it( 'falls back to another clicked tool that connected', () => {
		assert.deepEqual( findNewConnections( [ 'chatgpt' ], [ 'chatgpt', 'claude' ], 'claude', [] ), [
			'chatgpt',
		] );
	} );

	it( 'skips tools already shown as connected', () => {
		const clicked: AiTool[] = [ 'chatgpt', 'claude' ];
		assert.deepEqual(
			findNewConnections( [ 'chatgpt', 'claude' ], clicked, 'chatgpt', [ 'chatgpt' ] ),
			[ 'claude' ]
		);
		assert.deepEqual( findNewConnections( [ 'chatgpt' ], clicked, 'claude', [ 'chatgpt' ] ), [] );
	} );

	it( 'treats only full access as able to build', () => {
		assert.equal( isReadOnlyAccess( 'full' ), false );
		for ( const level of [ 'read_only', null, undefined, 'custom' ] ) {
			assert.equal( isReadOnlyAccess( level ), true );
		}
	} );
} );

describe( 'Finish payload', () => {
	it( 'builds the REST body with goal, site_name, description, and both languages', () => {
		const state = stateWith( {
			goal: 'sell',
			siteName: 'Ceramics Co',
			intent: 'A shop selling handmade ceramics.',
			locale: 'fr',
			uiLocale: 'it_IT',
		} );
		assert.deepEqual( buildWizardPayload( 'sell', state ), {
			goal: 'sell',
			site_name: 'Ceramics Co',
			description: 'A shop selling handmade ceramics.',
			locale: 'fr',
			ui_locale: 'it_IT',
		} );
	} );
} );

describe( 'rotating placeholder', () => {
	const variants = [ 'one', 'two', 'three', 'four', 'five' ];

	it( 'picks different placeholders for different random draws', () => {
		assert.equal(
			pickPlaceholder( variants, () => 0 ),
			'one'
		);
		assert.equal(
			pickPlaceholder( variants, () => 0.5 ),
			'three'
		);
		assert.equal(
			pickPlaceholder( variants, () => 0.99 ),
			'five'
		);
	} );
} );

describe( 'AI tool view', () => {
	it( 'starts on the choice of AI tool', () => {
		assert.equal( aiToolView( [], null, false ), 'choose' );
	} );

	it( 'waits after a Connect click', () => {
		assert.equal( aiToolView( [], 'claude', false ), 'waiting' );
	} );

	it( 'shows one tool as connected, even while waiting on the other', () => {
		assert.equal( aiToolView( [ 'chatgpt' ], null, false ), 'connected' );
		assert.equal( aiToolView( [ 'chatgpt' ], 'claude', false ), 'waiting' );
	} );

	it( 'shows both tools as connected once each one is', () => {
		assert.equal( aiToolView( [ 'chatgpt', 'claude' ], null, false ), 'both_connected' );
	} );

	it( 'puts read-only access ahead of every other state', () => {
		assert.equal( aiToolView( [ 'claude' ], 'claude', true ), 'read_only' );
		assert.equal( aiToolView( [ 'chatgpt', 'claude' ], null, true ), 'read_only' );
	} );
} );

describe( 'AI tool row status', () => {
	it( 'shows Connect on a tool that is neither connected nor waiting', () => {
		assert.equal( aiToolRowStatus( 'chatgpt', [], null, false ), null );
		assert.equal( aiToolRowStatus( 'chatgpt', [], 'claude', false ), null );
	} );

	it( 'shows Waiting only on the tool being waited for', () => {
		assert.equal( aiToolRowStatus( 'claude', [], 'claude', false ), 'waiting' );
	} );

	it( 'shows Connected, or Read only with read-only access', () => {
		assert.equal( aiToolRowStatus( 'claude', [ 'claude' ], 'claude', false ), 'connected' );
		assert.equal( aiToolRowStatus( 'claude', [ 'claude' ], null, true ), 'read_only' );
	} );
} );

describe( 'dashboard integration', () => {
	for ( const [ connected, promptCopied, integration ] of [
		[ [ 'chatgpt', 'claude' ], false, 'claude' ],
		[ [ 'chatgpt' ], true, 'chatgpt' ],
		[ [], true, 'other' ],
		[ [], false, 'none' ],
	] as const ) {
		it( `reports ${ integration } with ${ connected.join( '+' ) || 'nothing' } connected, copied ${ promptCopied }`, () => {
			assert.equal( dashboardIntegration( [ ...connected ], promptCopied ), integration );
		} );
	}
} );

describe( 'viewed step', () => {
	it( 'reports the setup choice while it is shown', () => {
		assert.equal( viewedStep( 0, true, false ), 'setup_choice' );
	} );

	it( 'reports nothing for the AI tool view, which records its own event', () => {
		assert.equal( viewedStep( 0, false, true ), null );
	} );

	it( 'reports the AI tool view when the page opened on it', () => {
		assert.equal( viewedStep( 0, false, true, true ), 'ai_tool' );
	} );

	it( 'reports the goal and details steps', () => {
		assert.equal( viewedStep( 0, false, false ), 'goal' );
		assert.equal( viewedStep( 1, false, false ), 'site_details' );
	} );
} );
