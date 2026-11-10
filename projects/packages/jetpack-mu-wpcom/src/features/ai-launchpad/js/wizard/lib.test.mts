import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	aiToolRowStatus,
	aiToolView,
	BRING_YOUR_AI_TOOL,
	buildWizardPayload,
	canContinue,
	CONNECT_YOURSELF_PROMPT,
	findNewConnection,
	goalsVariation,
	isLastStep,
	MCP_SERVER_URL,
	MCP_SETTINGS_URL,
	pickPlaceholder,
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
	it( 'shows the banner in the treatment only', () => {
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

describe( 'AI tool connection', () => {
	const CLICKED_AT = 1_762_430_000;

	it( 'counts a connection to a clicked tool whenever it was made, including before the click', () => {
		const clicks = { chatgpt: CLICKED_AT };
		for ( const connectedAt of [ CLICKED_AT - 86_400, CLICKED_AT, CLICKED_AT + 300 ] ) {
			assert.equal(
				findNewConnection(
					[ { integration: 'chatgpt', connected_at: connectedAt } ],
					clicks,
					'chatgpt'
				),
				'chatgpt'
			);
		}
	} );

	it( 'ignores tools the user never clicked Set up on, and unknown integrations', () => {
		assert.equal(
			findNewConnection(
				[
					{ integration: 'claude', connected_at: CLICKED_AT + 10 },
					{ integration: 'cursor', connected_at: CLICKED_AT + 10 },
				],
				{ chatgpt: CLICKED_AT },
				'chatgpt'
			),
			null
		);
		assert.equal( findNewConnection( [], { chatgpt: CLICKED_AT }, 'chatgpt' ), null );
	} );

	it( 'prefers the most recently clicked tool when several match', () => {
		const connections = [
			{ integration: 'chatgpt', connected_at: CLICKED_AT + 10 },
			{ integration: 'claude', connected_at: CLICKED_AT + 20 },
		];
		const clicks = { chatgpt: CLICKED_AT, claude: CLICKED_AT + 5 };
		assert.equal( findNewConnection( connections, clicks, 'claude' ), 'claude' );
		assert.equal( findNewConnection( connections, clicks, 'chatgpt' ), 'chatgpt' );
	} );

	it( 'falls back to another clicked tool that connected', () => {
		assert.equal(
			findNewConnection(
				[ { integration: 'chatgpt', connected_at: CLICKED_AT + 10 } ],
				{ chatgpt: CLICKED_AT, claude: CLICKED_AT + 5 },
				'claude'
			),
			'chatgpt'
		);
	} );

	it( 'skips tools already shown as connected', () => {
		const connections = [
			{ integration: 'chatgpt', connected_at: CLICKED_AT + 10 },
			{ integration: 'claude', connected_at: CLICKED_AT + 20 },
		];
		const clicks = { chatgpt: CLICKED_AT, claude: CLICKED_AT + 5 };
		assert.equal( findNewConnection( connections, clicks, 'chatgpt', [ 'chatgpt' ] ), 'claude' );
		assert.equal(
			findNewConnection( connections.slice( 0, 1 ), clicks, 'claude', [ 'chatgpt' ] ),
			null
		);
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

	it( 'waits after a Set up click', () => {
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
	it( 'shows Set up on a tool that is neither connected nor waiting', () => {
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

describe( 'viewed step', () => {
	it( 'reports the setup choice while it is shown', () => {
		assert.equal( viewedStep( 0, true, false ), 'setup_choice' );
	} );

	it( 'reports nothing for the AI tool view, which records its own event', () => {
		assert.equal( viewedStep( 0, false, true ), null );
	} );

	it( 'reports the goal and details steps', () => {
		assert.equal( viewedStep( 0, false, false ), 'goal' );
		assert.equal( viewedStep( 1, false, false ), 'site_details' );
	} );
} );

describe( 'another AI tool', () => {
	it( 'gives the copied prompt the MCP server address', () => {
		assert.ok( CONNECT_YOURSELF_PROMPT.includes( MCP_SERVER_URL ) );
	} );

	it( 'sends Allow full access to the write settings', () => {
		assert.equal( MCP_SETTINGS_URL, 'https://my.wordpress.com/me/preferences/mcp/write' );
	} );
} );
