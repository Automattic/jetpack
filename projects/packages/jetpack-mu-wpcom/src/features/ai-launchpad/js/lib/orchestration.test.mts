import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { decideInitialView, isAllTasksMode } from './orchestration.ts';
import type { TailoredOutput } from './types.ts';

const PAYLOAD = {} as TailoredOutput;

describe( 'isAllTasksMode', () => {
	it( 'is true when the all_tasks query param is set', () => {
		assert.equal( isAllTasksMode( '?page=site-setup-wp-admin&all_tasks=1' ), true );
		assert.equal( isAllTasksMode( '?all_tasks=1' ), true );
	} );

	it( 'is false when the param is absent or not enabling', () => {
		assert.equal( isAllTasksMode( '?page=site-setup-wp-admin' ), false );
		assert.equal( isAllTasksMode( '' ), false );
		assert.equal( isAllTasksMode( '?all_tasks=0' ), false );
	} );
} );

describe( 'decideInitialView', () => {
	it( 'shows the wizard with no AI output (new user), the list with it (returning user)', () => {
		assert.equal( decideInitialView( { ai_output: null } ), 'wizard' );
		assert.equal( decideInitialView( { ai_output: { payload: PAYLOAD } } ), 'list' );
	} );
} );
