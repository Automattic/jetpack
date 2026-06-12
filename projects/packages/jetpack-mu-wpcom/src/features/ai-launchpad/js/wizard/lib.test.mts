import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	buildWizardPayload,
	canContinue,
	GOAL_SLUGS,
	isLastStep,
	pickPlaceholder,
	toPrewarmInput,
	TOTAL_STEPS,
	type WizardState,
} from './lib.ts';

/**
 * Build a wizard state with sensible defaults.
 *
 * @param partial - Fields to override.
 * @return The wizard state.
 */
function stateWith( partial: Partial< WizardState > = {} ): WizardState {
	return { goal: null, siteName: '', intent: '', locale: 'en', ...partial };
}

describe( 'wizard step gating', () => {
	it( 'blocks Continue on step 0 until a goal is selected', () => {
		assert.equal( canContinue( 0, stateWith() ), false );
	} );

	it( 'enables Continue on step 0 once a goal is selected', () => {
		assert.equal( canContinue( 0, stateWith( { goal: 'write' } ) ), true );
	} );

	it( 'always allows submitting from the details step', () => {
		assert.equal( canContinue( 1, stateWith() ), true );
		assert.equal( canContinue( 1, stateWith( { goal: 'build' } ) ), true );
	} );

	it( 'treats only the final step as last', () => {
		assert.equal( isLastStep( 0 ), false );
		assert.equal( isLastStep( 1 ), true );
		assert.equal( TOTAL_STEPS, 2 );
	} );
} );

describe( 'Finish payload', () => {
	it( 'builds the REST body with goal, site_name, description, and locale', () => {
		const state = stateWith( {
			goal: 'sell',
			siteName: 'Ceramics Co',
			intent: 'A shop selling handmade ceramics.',
			locale: 'fr',
		} );
		assert.deepEqual( buildWizardPayload( 'sell', state ), {
			goal: 'sell',
			site_name: 'Ceramics Co',
			description: 'A shop selling handmade ceramics.',
			locale: 'fr',
		} );
	} );

	it( 'shares the same field shape with the prewarm input', () => {
		const state = stateWith( { goal: 'write', siteName: 'My Blog', intent: 'About food.' } );
		assert.deepEqual( toPrewarmInput( state ), {
			goal: 'write',
			site_name: 'My Blog',
			description: 'About food.',
			locale: 'en',
		} );
	} );

	it( 'reports goal undefined to prewarm when none is selected', () => {
		assert.equal( toPrewarmInput( stateWith() ).goal, undefined );
	} );
} );

describe( 'goal catalog', () => {
	it( 'exposes exactly the six contract goals', () => {
		assert.deepEqual( GOAL_SLUGS, [
			'write',
			'build',
			'sell',
			'newsletter',
			'educate',
			'portfolio',
		] );
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

	it( 'always returns a member of the variant list', () => {
		for ( let i = 0; i < 50; i++ ) {
			assert.ok( variants.includes( pickPlaceholder( variants ) ) );
		}
	} );

	it( 'produces more than one distinct value across many draws', () => {
		const seen = new Set< string >();
		for ( let i = 0; i < 200; i++ ) {
			seen.add( pickPlaceholder( variants ) );
		}
		assert.ok( seen.size > 1, 'expected the placeholder to rotate, got a single value' );
	} );
} );
