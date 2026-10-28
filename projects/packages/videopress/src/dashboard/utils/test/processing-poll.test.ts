import {
	LIBRARY_POLL_INTERVAL_MS,
	PROCESSING_POLL_BACKOFF_MS,
	PROCESSING_POLL_MAX_MS,
	PROCESSING_POLL_SLOW_INTERVAL_MS,
	libraryRefetchInterval,
	nextProcessingPoll,
} from '../processing-poll';

describe( 'libraryRefetchInterval', () => {
	it( 'backs off after the first minute', () => {
		expect( libraryRefetchInterval( true, PROCESSING_POLL_BACKOFF_MS - 1 ) ).toBe( 5000 );
		expect( libraryRefetchInterval( true, PROCESSING_POLL_BACKOFF_MS ) ).toBe( 15000 );
	} );

	it( 'does not poll when nothing is processing', () => {
		expect( libraryRefetchInterval( false, 0 ) ).toBe( false );
		// Elapsed time is irrelevant once processing has cleared.
		expect( libraryRefetchInterval( false, PROCESSING_POLL_MAX_MS * 2 ) ).toBe( false );
	} );

	it( 'polls while processing and under the cap', () => {
		expect( libraryRefetchInterval( true, 0 ) ).toBe( LIBRARY_POLL_INTERVAL_MS );
		expect( libraryRefetchInterval( true, PROCESSING_POLL_MAX_MS - 1 ) ).toBe(
			PROCESSING_POLL_SLOW_INTERVAL_MS
		);
	} );

	it( 'stops polling once the cap is reached, even while still processing (VIDP-298)', () => {
		// An orphaned record stuck isProcessing forever must not poll unbounded.
		expect( libraryRefetchInterval( true, PROCESSING_POLL_MAX_MS ) ).toBe( false );
		expect( libraryRefetchInterval( true, PROCESSING_POLL_MAX_MS + 1 ) ).toBe( false );
	} );
} );

describe( 'nextProcessingPoll', () => {
	it( 'stamps a fresh anchor on first sighting and polls', () => {
		const { anchor, interval } = nextProcessingPoll( null, [ '7' ], 1_000 );
		expect( anchor ).toEqual( { idsKey: '7', startedAt: 1_000 } );
		expect( interval ).toBe( LIBRARY_POLL_INTERVAL_MS );
	} );

	it( 'keeps the anchor while the same set is processing and caps on its budget', () => {
		const stamped = nextProcessingPoll( null, [ '7' ], 1_000 ).anchor;
		const underCap = nextProcessingPoll( stamped, [ '7' ], 1_000 + PROCESSING_POLL_MAX_MS - 1 );
		expect( underCap.anchor ).toBe( stamped );
		expect( underCap.interval ).toBe( PROCESSING_POLL_SLOW_INTERVAL_MS );
		const atCap = nextProcessingPoll( stamped, [ '7' ], 1_000 + PROCESSING_POLL_MAX_MS );
		expect( atCap.interval ).toBe( false );
	} );

	it( 'restamps when the processing set changes, so a new upload is polled after a stuck orphan hit the cap', () => {
		// Orphan "7" alone burned its budget…
		const orphanOnly = nextProcessingPoll( null, [ '7' ], 0 ).anchor;
		expect( nextProcessingPoll( orphanOnly, [ '7' ], PROCESSING_POLL_MAX_MS ).interval ).toBe(
			false
		);
		// …then a new upload "9" appears at t=16min: fresh budget, polling resumes.
		const later = PROCESSING_POLL_MAX_MS + 60_000;
		const { anchor, interval } = nextProcessingPoll( orphanOnly, [ '9', '7' ], later );
		expect( anchor ).toEqual( { idsKey: '7,9', startedAt: later } );
		expect( interval ).toBe( LIBRARY_POLL_INTERVAL_MS );
	} );

	it( 'treats the set as order-insensitive', () => {
		const stamped = nextProcessingPoll( null, [ '9', '7' ], 0 ).anchor;
		expect( nextProcessingPoll( stamped, [ '7', '9' ], 5_000 ).anchor ).toBe( stamped );
	} );

	it( 'keeps one budget for the same stuck set across view changes (set-keyed, not view-keyed)', () => {
		// The library ref survives filter/search/page changes; only the ids
		// identify the budget, so a capped orphan stays capped on a new view.
		const stamped = nextProcessingPoll( null, [ '7' ], 0 ).anchor;
		const afterViewChange = nextProcessingPoll( stamped, [ '7' ], PROCESSING_POLL_MAX_MS );
		expect( afterViewChange.anchor ).toBe( stamped );
		expect( afterViewChange.interval ).toBe( false );
	} );

	it( 'drops the anchor when processing clears, so the next processing item gets a fresh budget', () => {
		const stamped = nextProcessingPoll( null, [ '7' ], 0 ).anchor;
		const cleared = nextProcessingPoll( stamped, [], 5_000 );
		expect( cleared.anchor ).toBeNull();
		expect( cleared.interval ).toBe( false );
	} );
} );
