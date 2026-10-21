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
	const INFERRED = { goal: 'build', site_name: 'Acme', description: 'Tools' } as const;
	const OUTPUT = { payload: PAYLOAD };

	for ( const [ name, data, view ] of [
		[ 'ai_output', { ai_output: OUTPUT }, 'list' ],
		[ 'inferred_input', { ai_output: null, inferred_input: INFERRED }, 'auto' ],
		[
			'auto_tailoring',
			{ ai_output: null, inferred_input: null, auto_tailoring: true },
			'waiting',
		],
		[ 'nothing', { ai_output: null }, 'wizard' ],
		[
			'ai_output over the others',
			{ ai_output: OUTPUT, inferred_input: INFERRED, auto_tailoring: true },
			'list',
		],
	] as const ) {
		it( `returns ${ view } for ${ name }`, () => {
			assert.equal( decideInitialView( data ), view );
		} );
	}
} );
