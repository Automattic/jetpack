import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MAX_POLL_FAILURES, POLL_INTERVAL_MS, pollFeatureArrival } from './feature-arrival.ts';

/**
 * A clock that advances only when the poll sleeps, so no test waits in real time.
 *
 * @return The clock's `now` and `sleep`.
 */
function fakeClock() {
	let time = 0;

	return {
		now: () => time,
		sleep: async ( ms: number ) => {
			time += ms;
		},
	};
}

describe( 'pollFeatureArrival', () => {
	const unreachable = Array( MAX_POLL_FAILURES ).fill( 'error' );
	const cases: [ string, ( boolean | 'error' )[], boolean, number, number ][] = [
		[ 'arrives on the third poll', [ false, false, true ], true, 3, 0 ],
		[ 'keeps polling through a failed request', [ 'error', true ], true, 2, 0 ],
		[ 'gives up at the timeout', [], false, 8, 0 ],
		[
			'gives up once the route keeps failing',
			unreachable,
			false,
			MAX_POLL_FAILURES,
			MAX_POLL_FAILURES,
		],
		[
			'resets the count after an answer',
			[ 'error', false, ...unreachable ],
			false,
			MAX_POLL_FAILURES + 2,
			MAX_POLL_FAILURES,
		],
	];

	for ( const [ name, answers, arrived, polls, failures ] of cases ) {
		it( name, async () => {
			let calls = 0;
			const hasFeature = async () => {
				const answer = answers[ calls++ ] ?? false;
				if ( 'error' === answer ) {
					throw new Error( 'rest_forbidden' );
				}
				return answer;
			};

			const outcome = await pollFeatureArrival( hasFeature, {
				...fakeClock(),
				timeout: 8 * POLL_INTERVAL_MS,
			} );

			assert.deepEqual( outcome, { arrived, elapsedMs: polls * POLL_INTERVAL_MS, failures } );
			assert.equal( calls, polls );
		} );
	}

	it( 'stops without asking again once aborted', async () => {
		const controller = new AbortController();
		let calls = 0;

		const outcome = await pollFeatureArrival(
			async () => {
				calls++;
				controller.abort();
				return false;
			},
			{ ...fakeClock(), signal: controller.signal }
		);

		assert.equal( outcome.arrived, false );
		assert.equal( calls, 1 );
	} );
} );
