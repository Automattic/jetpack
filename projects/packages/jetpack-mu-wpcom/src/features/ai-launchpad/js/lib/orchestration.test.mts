import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { decideInitialView, type OrchestrationData } from './orchestration.ts';
import type { TailoredOutput } from './types.ts';

const PAYLOAD = {} as TailoredOutput;

describe( 'decideInitialView', () => {
	it( 'shows the wizard when the site has no AI output (new user)', () => {
		const data: OrchestrationData = { ai_output: null };
		assert.equal( decideInitialView( data ), 'wizard' );
	} );

	it( 'shows the list when the site already has AI output (returning user)', () => {
		const data: OrchestrationData = { ai_output: { payload: PAYLOAD } };
		assert.equal( decideInitialView( data ), 'list' );
	} );
} );
