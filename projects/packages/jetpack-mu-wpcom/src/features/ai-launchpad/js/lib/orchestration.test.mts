import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	buildAutoInput,
	decideInitialView,
	isAllTasksMode,
	readPath,
	startsOnAiTool,
} from './orchestration.ts';
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

describe( 'startsOnAiTool', () => {
	const ARG = '?page=site-setup-wp-admin&start=ai-tool';
	for ( const [ search, view, expected ] of [
		[ ARG, 'wizard', true ],
		[ ARG, 'list', false ],
		[ '?page=site-setup-wp-admin', 'wizard', false ],
	] as const ) {
		it( `is ${ expected } for ${ search } on the ${ view } view`, () => {
			assert.equal( startsOnAiTool( search, view ), expected );
		} );
	}
} );

describe( 'readPath', () => {
	for ( const [ search, path ] of [
		[ '?page=site-setup-wp-admin', '/wpcom/v2/ai-launchpad' ],
		[ '?page=site-setup-wp-admin&all_tasks=1', '/wpcom/v2/ai-launchpad?all_tasks=1' ],
		[ '?page=site-setup-wp-admin&start=ai-tool', '/wpcom/v2/ai-launchpad?start=ai-tool' ],
		[ '?page=site-setup-wp-admin&start=other', '/wpcom/v2/ai-launchpad' ],
	] as const ) {
		it( `reads ${ path } for ${ search }`, () => {
			assert.equal( readPath( search ), path );
		} );
	}
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
