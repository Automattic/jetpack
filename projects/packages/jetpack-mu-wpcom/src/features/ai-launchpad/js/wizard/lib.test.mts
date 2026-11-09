import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	BRING_YOUR_AI_TOOL,
	buildWizardPayload,
	canContinue,
	findNewConnection,
	goalsVariation,
	isLastStep,
	pickPlaceholder,
	showsSetupChoice,
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
