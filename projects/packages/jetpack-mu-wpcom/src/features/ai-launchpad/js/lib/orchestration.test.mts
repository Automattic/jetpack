import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildAutoInput, decideInitialView, isAllTasksMode } from './orchestration.ts';
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

const INFERRED = { goal: 'build', site_name: 'Acme', description: 'Tools' } as const;

describe( 'decideInitialView', () => {
	for ( const [ name, data, view ] of [
		[ 'inferred_input', { ai_output: null, inferred_input: INFERRED }, 'auto' ],
		[ 'nothing', { ai_output: null }, 'wizard' ],
		[
			'ai_output over the others',
			{ ai_output: { payload: PAYLOAD }, inferred_input: INFERRED },
			'list',
		],
	] as const ) {
		it( `returns ${ view } for ${ name }`, () => {
			assert.equal( decideInitialView( data ), view );
		} );
	}
} );

describe( 'buildAutoInput', () => {
	it( 'writes in the site language and subtitles in the user language', () => {
		const data = {
			ai_output: null,
			inferred_input: INFERRED,
			site: { language: 'fr_FR' },
			user_language: 'it_IT',
		};
		assert.deepEqual( buildAutoInput( data ), {
			...INFERRED,
			locale: 'fr_FR',
			ui_locale: 'it_IT',
		} );
	} );
} );
