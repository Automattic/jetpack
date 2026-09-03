import { findRestoreRow, mergeRestoreRows, normalizeRestore } from '../restores';
import type { ActivityItem } from '../../../types/activity';
import type { RecentRestore } from '../../api/restore';

/**
 * A collection row, settled and successful unless overridden.
 *
 * @param overrides - Fields to replace.
 * @return The row.
 */
function restore( overrides: Partial< RecentRestore > = {} ): RecentRestore {
	return {
		restore_id: 912682,
		rewind_id: '1786512000.11',
		when: '2026-09-03 14:11:00',
		settled: true,
		succeeded: true,
		...overrides,
	};
}

/**
 * A non-backup activity row stamped at the given instant.
 *
 * @param id        - The row's activity id.
 * @param published - Its ISO timestamp.
 * @return The row.
 */
function activity( id: string, published: string ): ActivityItem {
	return {
		id,
		kind: 'other',
		title: id,
		publishedAt: published,
		actor: { type: 'Application', name: 'Jetpack' },
	};
}

const PAGE_1_OF_1 = { page: 1, totalPages: 1, sortOrder: 'desc' as const };

describe( 'normalizeRestore', () => {
	test.each( [
		[ { settled: true, succeeded: true }, 'Restore complete' ],
		[ { settled: true, succeeded: false }, 'Restore failed' ],
		[ { settled: false, succeeded: false }, 'Restore in progress' ],
	] )( 'titles %p as %p', ( status, title ) => {
		expect( normalizeRestore( restore( status ) )?.title ).toBe( title );
	} );

	test( 'names the backup it was aiming at', () => {
		expect( normalizeRestore( restore() )?.summary ).toBe( 'Restore to Aug 12, 2026, 5:20 AM' );
	} );

	test( 'leaves the summary off a rewind id that is not a timestamp', () => {
		const row = normalizeRestore( restore( { rewind_id: 'not-a-timestamp' } ) );
		// Witness: the row itself is still built, so the missing summary is
		// this branch and not a dropped row.
		expect( row?.title ).toBe( 'Restore complete' );
		expect( row?.summary ).toBeUndefined();
	} );

	test( 'places a zone-less `when` in UTC', () => {
		expect( normalizeRestore( restore() )?.publishedAt ).toBe( '2026-09-03T14:11:00.000Z' );
	} );

	test( 'drops a row with no readable timestamp', () => {
		expect( normalizeRestore( restore( { when: '' } ) ) ).toBeNull();
	} );

	test( 'is not a backup row', () => {
		expect( normalizeRestore( restore() )?.kind ).toBe( 'restore' );
	} );
} );

describe( 'findRestoreRow', () => {
	test( 'resolves the id the list hands the URL', () => {
		const row = normalizeRestore( restore() );
		expect( findRestoreRow( [ restore() ], row?.id ?? '' ) ).toEqual( row );
	} );

	test( 'answers null for an id no row carries', () => {
		expect( findRestoreRow( [ restore() ], 'restore-1' ) ).toBeNull();
	} );
} );

describe( 'mergeRestoreRows', () => {
	test( 'splices a restore between the rows it falls between', () => {
		const merged = mergeRestoreRows(
			[
				activity( 'newer', '2026-09-03T18:00:00.000Z' ),
				activity( 'older', '2026-09-03T08:00:00.000Z' ),
			],
			[ restore() ],
			PAGE_1_OF_1
		);
		expect( merged.map( row => row.id ) ).toEqual( [ 'newer', 'restore-912682', 'older' ] );
	} );

	test( 'keeps a restore newer than every row on the first page', () => {
		const merged = mergeRestoreRows(
			[ activity( 'older', '2026-09-03T08:00:00.000Z' ) ],
			[ restore() ],
			{ page: 1, totalPages: 4, sortOrder: 'desc' }
		);
		expect( merged.map( row => row.id ) ).toEqual( [ 'restore-912682', 'older' ] );
	} );

	test( 'leaves it to the page that owns its span', () => {
		const args = [
			[ activity( 'newest', '2026-09-04T08:00:00.000Z' ) ],
			[ restore() ],
			{ page: 2, totalPages: 4, sortOrder: 'desc' as const },
		] as const;
		const merged = mergeRestoreRows( ...args );
		expect( merged.map( row => row.id ) ).toEqual( [ 'newest' ] );
		// Witness: the same restore does land once the page's span reaches it.
		expect(
			mergeRestoreRows( args[ 0 ], args[ 1 ], { ...args[ 2 ], totalPages: 2 } ).map( row => row.id )
		).toEqual( [ 'newest', 'restore-912682' ] );
	} );

	test( 'follows an ascending list', () => {
		const merged = mergeRestoreRows(
			[
				activity( 'older', '2026-09-03T08:00:00.000Z' ),
				activity( 'newer', '2026-09-03T18:00:00.000Z' ),
			],
			[ restore() ],
			{ page: 1, totalPages: 1, sortOrder: 'asc' }
		);
		expect( merged.map( row => row.id ) ).toEqual( [ 'older', 'restore-912682', 'newer' ] );
	} );

	test( 'orders several restores among themselves', () => {
		const merged = mergeRestoreRows(
			[ activity( 'oldest', '2026-09-01T00:00:00.000Z' ) ],
			[
				restore( { restore_id: 1, when: '2026-09-02 10:00:00' } ),
				restore( { restore_id: 2, when: '2026-09-03 10:00:00' } ),
			],
			PAGE_1_OF_1
		);
		expect( merged.map( row => row.id ) ).toEqual( [ 'restore-2', 'restore-1', 'oldest' ] );
	} );

	test( 'returns the page untouched when the collection could not be read', () => {
		const items = [ activity( 'only', '2026-09-03T08:00:00.000Z' ) ];
		expect( mergeRestoreRows( items, null, PAGE_1_OF_1 ) ).toBe( items );
	} );
} );
