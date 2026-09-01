import apiFetch from '@wordpress/api-fetch';
import { fetchRecentRestores } from '../restore';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
const mockedApiFetch = apiFetch as unknown as jest.Mock;

beforeEach( () => {
	mockedApiFetch.mockReset();
} );

// The single point where the restores collection's foreign vocabulary is
// quarantined. Its consumer `pickLiveRestore` is well covered; this is
// the mapper that produces what that consumer reads, and everything it
// gets wrong is invisible downstream.
describe( 'fetchRecentRestores', () => {
	/**
	 * Answer the collection route with a given body.
	 *
	 * @param body - What the route resolves with.
	 */
	function respondWith( body: unknown ) {
		mockedApiFetch.mockResolvedValue( body );
	}

	test( 'distinguishes a failed read from an empty collection', async () => {
		// The legacy route answers a WordPress.com reply it cannot decode
		// with a bare `null`, which WordPress then serves as HTTP 200 — so
		// this resolves rather than rejecting. Returning `[]` for it would tell
		// a caller deciding whether to start a destructive restore that
		// nothing is running, which is the opposite of what it knows.
		respondWith( null );
		await expect( fetchRecentRestores() ).resolves.toBeNull();

		respondWith( [] );
		await expect( fetchRecentRestores() ).resolves.toEqual( [] );
	} );

	test.each( [
		[ 'finished', true ],
		[ 'FINISHED', true ],
		[ 'success-with-errors', true ],
		[ 'aborted', true ],
		[ 'running', false ],
		[ 'started', false ],
		[ 'a-spelling-nobody-has-seen', false ],
	] )( 'reads status %p as settled=%p', async ( status, settled ) => {
		respondWith( [ { restore_id: 1, rewind_id: '1786512000.11', when: '', status } ] );
		const rows = await fetchRecentRestores();
		expect( rows?.[ 0 ].settled ).toBe( settled );
	} );

	test.each( [
		[ 'finished', true ],
		[ 'FINISHED', true ],
		// Both spellings, because the collection route maps nothing and
		// `Restore_Bridge::STATUS_MAP` already equates these two. Pinning
		// this to `finished` alone would silently kill the review prompt's
		// restore trigger on any site whose upstream says `success`.
		[ 'success', true ],
		// Settled and not a failure, but not a restore to ask anyone to
		// praise either — kept distinct here as `STATUS_MAP` keeps it.
		[ 'success-with-errors', false ],
		[ 'fail', false ],
		[ 'aborted', false ],
		[ 'running', false ],
		[ 'a-spelling-nobody-has-seen', false ],
	] )( 'reads status %p as succeeded=%p', async ( status, succeeded ) => {
		respondWith( [ { restore_id: 1, rewind_id: '1786512000.11', when: '', status } ] );
		const rows = await fetchRecentRestores();
		expect( rows?.[ 0 ].succeeded ).toBe( succeeded );
	} );

	test( 'treats a non-string status as not settled', async () => {
		// Unknown means adoptable, and the confirmation decides. Guessing
		// the other way would make an unrecognised spelling of "running"
		// permanently unrecoverable.
		respondWith( [ { restore_id: 1, rewind_id: '1786512000.11', status: 7 } ] );
		const rows = await fetchRecentRestores();
		expect( rows?.[ 0 ].settled ).toBe( false );
	} );

	test( 'carries a missing timestamp as an empty string rather than dropping the row', async () => {
		respondWith( [ { restore_id: 1, rewind_id: '1786512000.11' } ] );
		const rows = await fetchRecentRestores();
		expect( rows ).toHaveLength( 1 );
		expect( rows?.[ 0 ].when ).toBe( '' );
	} );

	test( 'drops rows with no usable restore id', async () => {
		respondWith( [
			{ restore_id: 0, rewind_id: '1786512000.11' },
			{ restore_id: 'nope', rewind_id: '1786512000.11' },
			{ restore_id: 912682, rewind_id: '1786512000.11' },
		] );
		const rows = await fetchRecentRestores();
		expect( rows?.map( r => r.restore_id ) ).toEqual( [ 912682 ] );
	} );

	test( 'coerces a numeric rewind id to the string the match expects', async () => {
		respondWith( [ { restore_id: 1, rewind_id: 1786512000.11 } ] );
		const rows = await fetchRecentRestores();
		expect( rows?.[ 0 ].rewind_id ).toBe( '1786512000.11' );
	} );
} );
