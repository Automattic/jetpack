import {
	completedCount,
	headingDomain,
	isTemporaryDomain,
	nextIncompleteId,
	setupMode,
	taskStates,
} from '../model';
import { VERIFIED, lookup, lookupRow, makeStatus } from './fixtures/status';

const SENT = '2026-10-18T10:00:00Z';

describe( 'setupMode', () => {
	it.each( [
		[ 'no account', makeStatus( { withAccount: false } ), 'setup' ],
		[ 'records pending', makeStatus(), 'setup' ],
		[ 'verified, no test', makeStatus( VERIFIED ), 'setup' ],
		[
			'automatic test not seen yet',
			makeStatus( { ...VERIFIED, onboarding: { test_sent_at: SENT, auto_test_log_id: '42' } } ),
			'setup',
		],
		[
			'test sent and seen',
			makeStatus( { ...VERIFIED, onboarding: { test_sent_at: SENT, verified_seen_at: SENT } } ),
			'active',
		],
		[ 'finished or skipped', makeStatus( { onboarding: { closed_at: SENT } } ), 'active' ],
		[
			'closed, then reset (no account)',
			makeStatus( { withAccount: false, onboarding: { closed_at: SENT } } ),
			'setup',
		],
	] )( 'is right when %s', ( _name, status, mode ) => {
		expect( setupMode( status ) ).toBe( mode );
	} );
} );

describe( 'taskStates', () => {
	it( 'locks the records and the test until there is an account', () => {
		expect( taskStates( makeStatus( { withAccount: false } ), null ) ).toEqual( {
			sender: 'todo',
			connect: 'locked',
			test: 'locked',
		} );
	} );

	it.each( [
		[ 'nothing looked up yet', null, 'todo' ],
		[ 'nothing found', lookup( [ lookupRow( {} ), lookupRow( { purpose: 'dkim' } ) ] ), 'todo' ],
		[
			'one found',
			lookup( [ lookupRow( { state: 'found' } ), lookupRow( { purpose: 'dkim' } ) ] ),
			'waiting',
		],
		[
			'a record needs a fix',
			lookup( [
				lookupRow( { state: 'found' } ),
				lookupRow( { purpose: 'dkim', state: 'needs_fix', problem: 'wrong_value' } ),
			] ),
			'needs_fix',
		],
		[
			'DNS can’t be reached',
			lookup( [
				lookupRow( { state: 'no_answer' } ),
				lookupRow( { purpose: 'dkim', state: 'no_answer' } ),
			] ),
			'no_answer',
		],
	] )( 'gives the records task the right state when %s', ( _name, rows, state ) => {
		expect( taskStates( makeStatus(), rows ).connect ).toBe( state );
	} );

	it( 'keeps the test locked once connected while sending is still off', () => {
		const states = taskStates( makeStatus( { ...VERIFIED, settings: { enabled: false } } ), null );
		expect( states.connect ).toBe( 'done' );
		expect( states.test ).toBe( 'locked' );
	} );

	it.each( [
		[ 'not sent', {}, null, 'todo' ],
		[ 'sent on this page', {}, 'sent', 'sent' ],
		[ 'failed on this page', {}, 'failed', 'failed' ],
		[ 'sent earlier', { test_sent_at: SENT }, null, 'sent' ],
		[ 'sent automatically', { test_sent_at: SENT, auto_test_log_id: '42' }, null, 'auto' ],
		[ 'automatic test failed', { auto_test_log_id: '42' }, null, 'todo' ],
		[ 'skipped', { closed_at: SENT }, null, 'skipped' ],
	] as const )(
		'gives the test task the right state when %s',
		( _name, onboarding, local, state ) => {
			expect( taskStates( makeStatus( { ...VERIFIED, onboarding } ), null, local ).test ).toBe(
				state
			);
		}
	);
} );

describe( 'progress', () => {
	it( 'counts done, sent, automatic and skipped tests as complete', () => {
		expect( completedCount( { sender: 'done', connect: 'done', test: 'skipped' } ) ).toBe( 3 );
		expect( completedCount( { sender: 'done', connect: 'waiting', test: 'locked' } ) ).toBe( 1 );
	} );

	it( 'opens the first task left to do, skipping locked ones', () => {
		expect( nextIncompleteId( { sender: 'todo', connect: 'locked', test: 'locked' } ) ).toBe(
			'sender'
		);
		expect( nextIncompleteId( { sender: 'done', connect: 'needs_fix', test: 'locked' } ) ).toBe(
			'connect'
		);
		expect( nextIncompleteId( { sender: 'done', connect: 'done', test: 'auto' } ) ).toBeNull();
	} );
} );

describe( 'headingDomain', () => {
	it( 'names the domain, but not a temporary address', () => {
		expect( headingDomain( makeStatus() ) ).toBe( 'example.com' );
		expect(
			headingDomain( makeStatus( { withAccount: false, suggested_domain: '127.0.0.1' } ) )
		).toBe( '' );
	} );

	it.each( [ '127.0.0.1', 'localhost', 'site.local', 'example.wpcomstaging.com', 'shop.test' ] )(
		'treats %s as temporary',
		host => expect( isTemporaryDomain( host ) ).toBe( true )
	);
} );
