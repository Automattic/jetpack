import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	aiToolRowStatus,
	aiToolView,
	dashboardIntegration,
	existingConnections,
	BRING_YOUR_AI_TOOL,
	buildWizardPayload,
	canContinue,
	checkOnReturn,
	connectedFooterLead,
	findNewConnections,
	firstScreen,
	footerExit,
	footerShowsDashboard,
	trackedVariation,
	isReadOnlyAccess,
	goalsVariation,
	isLastStep,
	mcpPollSchedule,
	otherConnectionCount,
	otherToolConnected,
	otherWaitBaseline,
	pickPlaceholder,
	progressFraction,
	rewaitOnReturn,
	rewaitOtherOnReturn,
	showsSetupChoice,
	viewedStep,
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

describe( 'waiting again for another AI tool on return to the tab', () => {
	for ( const [ timedOut, otherConnected, remote, baseline ] of [
		[ 2, false, true, 2 ],
		[ 2, false, false, null ],
		[ 2, true, true, null ],
		[ null, false, true, null ],
	] as const ) {
		it( `waits from ${ baseline } (timed out at ${ timedOut }, connected ${ otherConnected }, remote ${ remote })`, () => {
			assert.equal(
				rewaitOtherOnReturn( { timedOut, otherConnected, pollsRemotely: remote } ),
				baseline
			);
		} );
	}
} );

describe( 'checking once on return to the tab', () => {
	const idle = {
		waitingFor: null,
		waitingForOther: false,
		otherConnected: false,
		readOnly: false,
		connected: [],
		timedOut: null,
		otherTimedOut: null,
		pollsRemotely: false,
	};
	for ( const [ name, state, checks ] of [
		[ 'with nothing waited for', {}, true ],
		[ 'after a local wait timed out', { timedOut: 'claude' }, true ],
		[ 'once another AI tool connected', { waitingForOther: true, otherConnected: true }, true ],
		[ 'while waiting for a tool', { waitingFor: 'claude' }, false ],
		[ 'once both tools connected', { connected: [ 'chatgpt', 'claude' ] }, false ],
		[ 'while waiting for another AI tool', { waitingForOther: true }, false ],
		[ 'while read-only waits again', { readOnly: true, connected: [ 'chatgpt' ] }, false ],
		[ 'when a remote wait waits again', { timedOut: 'claude', pollsRemotely: true }, false ],
		[ 'after a local wait for another AI tool timed out', { otherTimedOut: 1 }, true ],
		[
			'when a remote wait for another AI tool waits again',
			{ otherTimedOut: 0, pollsRemotely: true },
			false,
		],
	] as const ) {
		it( `checks ${ checks } ${ name }`, () => {
			assert.equal(
				checkOnReturn( { ...idle, ...state, connected: [ ...( state.connected ?? [] ) ] } ),
				checks
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
	const none = {
		connections: [],
		clicked: [],
		waitingFor: null,
		connected: [],
		existingKnown: true,
	};
	for ( const [ name, state, expected ] of [
		[ 'a tool nobody clicked Connect on', { connections: [ 'claude' ] }, [ 'claude' ] ],
		[
			'only clicked tools before the open-time read',
			{
				connections: [ 'claude', 'chatgpt' ],
				clicked: [ 'chatgpt' ],
				waitingFor: 'chatgpt',
				existingKnown: false,
			},
			[ 'chatgpt' ],
		],
		[ 'nothing for an unknown integration', { connections: [ 'cursor' ] }, [] ],
		[
			'the tool waited for last, even if older',
			{
				connections: [ 'chatgpt', 'claude' ],
				clicked: [ 'chatgpt', 'claude' ],
				waitingFor: 'claude',
			},
			[ 'chatgpt', 'claude' ],
		],
		[
			'an unclicked tool before the tool waited for',
			{ connections: [ 'claude', 'chatgpt' ], clicked: [ 'chatgpt' ], waitingFor: 'chatgpt' },
			[ 'claude', 'chatgpt' ],
		],
		[
			'the newest last when nothing is waited for',
			{ connections: [ 'chatgpt', 'claude' ] },
			[ 'claude', 'chatgpt' ],
		],
		[
			'only tools not yet shown',
			{
				connections: [ 'chatgpt', 'claude' ],
				clicked: [ 'chatgpt', 'claude' ],
				waitingFor: 'chatgpt',
				connected: [ 'chatgpt' ],
			},
			[ 'claude' ],
		],
	] as const ) {
		it( `counts ${ name }`, () => {
			assert.deepEqual(
				findNewConnections( {
					...none,
					...state,
					connections: [ ...( state.connections ?? [] ) ],
					clicked: [ ...( 'clicked' in state ? state.clicked : [] ) ],
					connected: [ ...( 'connected' in state ? state.connected : [] ) ],
				} ),
				[ ...expected ]
			);
		} );
	}

	for ( const [ name, state, expected ] of [
		[
			'every tool, oldest first',
			{ connections: [ 'chatgpt', 'claude' ] },
			[ 'claude', 'chatgpt' ],
		],
		[
			'no clicked tool',
			{ connections: [ 'chatgpt', 'claude' ], clicked: [ 'claude' ] },
			[ 'chatgpt' ],
		],
		[
			'no tool already shown',
			{ connections: [ 'chatgpt', 'claude' ], connected: [ 'chatgpt' ] },
			[ 'claude' ],
		],
		[ 'no unknown integrations', { connections: [ 'cursor', 'claude' ] }, [ 'claude' ] ],
	] as const ) {
		it( `records as connected before the view opened ${ name }`, () => {
			assert.deepEqual(
				existingConnections( {
					connections: [ ...state.connections ],
					clicked: [ ...( 'clicked' in state ? state.clicked : [] ) ],
					connected: [ ...( 'connected' in state ? state.connected : [] ) ],
				} ),
				[ ...expected ]
			);
		} );
	}

	it( 'treats only read_only access as read only', () => {
		assert.equal( isReadOnlyAccess( 'read_only' ), true );
		for ( const level of [ 'full', null, undefined, 'custom' ] ) {
			assert.equal( isReadOnlyAccess( level ), false );
		}
	} );
} );

describe( 'another AI tool connection', () => {
	for ( const [ value, count ] of [
		[ 3, 3 ],
		[ 0, 0 ],
		[ undefined, null ],
		[ null, null ],
		[ '2', null ],
		[ -1, null ],
		[ 1.5, null ],
	] as const ) {
		it( `reads ${ JSON.stringify( value ) } as ${ count }`, () => {
			assert.equal( otherConnectionCount( value ), count );
		} );
	}

	for ( const [ baseline, count, connected ] of [
		[ 1, 2, true ],
		[ 1, 1, false ],
		[ 2, 1, false ],
		[ null, 2, false ],
		[ 1, null, false ],
	] as const ) {
		it( `connected ${ connected } at count ${ count } from ${ baseline }`, () => {
			assert.equal( otherToolConnected( baseline, count ), connected );
		} );
	}
} );

describe( 'another AI tool wait baseline', () => {
	for ( const [ baseline, count, next ] of [
		[ null, 3, 3 ],
		[ null, null, null ],
		[ 2, 1, 1 ],
		[ 2, 3, 2 ],
		[ 2, null, 2 ],
	] as const ) {
		it( `waits from ${ next } (was ${ baseline }, count ${ count })`, () => {
			assert.equal( otherWaitBaseline( baseline, count ), next );
		} );
	}
} );

describe( 'connected footer', () => {
	for ( const [ connected, otherConnected, lead ] of [
		[ [], false, null ],
		[ [], true, 'dashboard' ],
		[ [ 'chatgpt' ], false, 'chatgpt' ],
		[ [ 'chatgpt' ], true, 'chatgpt' ],
		[ [ 'chatgpt', 'claude' ], false, 'dashboard' ],
	] as const ) {
		it( `leads with ${ lead } (${ connected.join( '+' ) || 'nothing' } connected, another tool ${ otherConnected })`, () => {
			assert.equal( connectedFooterLead( [ ...connected ], otherConnected ), lead );
		} );
	}
} );

describe( 'progress bar', () => {
	for ( const [ step, showAiTool, anyConnected, fraction ] of [
		[ 0, false, false, 0.5 ],
		[ 1, false, false, 1 ],
		[ 0, true, false, 0.5 ],
		[ 0, true, true, 1 ],
	] as const ) {
		it( `fills ${ fraction } on step ${ step } (AI tool view ${ showAiTool }, connected ${ anyConnected })`, () => {
			assert.equal( progressFraction( step, showAiTool, anyConnected ), fraction );
		} );
	}
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
