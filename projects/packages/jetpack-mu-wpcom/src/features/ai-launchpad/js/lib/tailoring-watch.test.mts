import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { watchTailoring } from './tailoring-watch.ts';
import { resetTracksContext } from './tracks.ts';
import type { TrackEventProps } from './types.ts';

// tracks.ts touches window only inside record(), so a bare object is enough.
const win = globalThis as unknown as {
	window: { _tkq?: unknown[]; wpcomAiLaunchpadTracks?: unknown };
};

/**
 * The abandoned events recorded so far, as their props.
 *
 * @return The props of each event.
 */
const abandonedEvents = () =>
	( ( win.window._tkq ?? [] ) as Array< [ string, string, TrackEventProps ] > )
		.filter(
			( [ kind, name ] ) =>
				'recordEvent' === kind && 'jetpack_ai_launchpad_tailoring_abandoned' === name
		)
		.map( ( [ , , props ] ) => props );

describe( 'watchTailoring', () => {
	let page: EventTarget;
	let clock: number;
	const now = () => clock;
	const leave = () => page.dispatchEvent( new Event( 'pagehide' ) );

	beforeEach( () => {
		page = new EventTarget();
		clock = 1000;
		resetTracksContext();
		win.window = {
			_tkq: [],
			wpcomAiLaunchpadTracks: {
				props: { channel: 'web', agent_name: 'ai_launchpad', source: 'none' },
				identity: null,
			},
		};
	} );

	it( 'records leaving while the AI call is still running', () => {
		watchTailoring( 'session-id', page, now );
		clock += 4012.4;
		leave();

		const events = abandonedEvents();
		assert.equal( events.length, 1 );
		assert.equal( events[ 0 ].stage, 'ai' );
		assert.equal( events[ 0 ].elapsed_ms, 4012 );
		assert.equal( events[ 0 ].ai_session_id, 'session-id' );
		// Flags the event for the transport's keepalive path, so it survives the unload.
		assert.equal( events[ 0 ].use_beacon, true );
		// The standard props ride along, and this event does not override them.
		assert.equal( events[ 0 ].channel, 'web' );
		assert.equal( events[ 0 ].source, 'none' );
	} );

	it( 'records leaving while the result is being saved', () => {
		const watch = watchTailoring( 'session-id', page, now );
		clock += 9000;
		watch.setStage( 'saving' );
		clock += 250;
		leave();

		const events = abandonedEvents();
		assert.equal( events.length, 1 );
		assert.equal( events[ 0 ].stage, 'saving' );
		assert.equal( events[ 0 ].elapsed_ms, 9250 );
	} );

	it( 'records nothing once the run has settled', () => {
		const watch = watchTailoring( 'session-id', page, now );
		watch.setStage( 'saving' );
		watch.settle();
		leave();

		assert.deepEqual( abandonedEvents(), [] );
	} );

	it( 'records once even if the page hides twice', () => {
		// A page restored from the back/forward cache can hide again while the run is still going.
		const watch = watchTailoring( 'session-id', page, now );
		leave();
		watch.setStage( 'saving' );
		leave();
		watch.settle();

		assert.equal( abandonedEvents().length, 1 );
	} );

	it( 'reports a run with no session id as "none"', () => {
		watchTailoring( '', page, now );
		leave();

		assert.equal( abandonedEvents()[ 0 ].ai_session_id, 'none' );
	} );
} );
