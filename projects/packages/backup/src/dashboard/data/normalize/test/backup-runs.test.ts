import { matchBackupRun } from '../backup-runs';

// Starts and sizes from a live v3 response; each rewind id is when that backup finished.
const RECORDS = [
	{ period: 1791312007, size: 4456295019 },
	{ period: 1791225607, size: 0 },
	{ period: 1791139207, size: 4444532929 },
];
// The newest row on screen when the sizes were requested.
const SEEN_UP_TO = 1791400000;

/**
 * A backup row as `matchBackupRun` reads it.
 *
 * @param rewindId    - When the backup finished.
 * @param isDiscarded - Whether WordPress.com has aged the backup out.
 * @return The row.
 */
function row( rewindId: string, isDiscarded = false ) {
	return { rewindId, isDiscarded };
}

describe( 'matchBackupRun', () => {
	it( 'pairs a finish with the latest start at or before it', () => {
		expect( matchBackupRun( row( '1791313657.958' ), RECORDS, SEEN_UP_TO ) ).toEqual( {
			siteSize: 4456295019,
			duration: 1651,
		} );
	} );

	it( 'keeps the duration when WordPress.com reports a size of 0', () => {
		expect( matchBackupRun( row( '1791227407' ), RECORDS, SEEN_UP_TO ) ).toEqual( {
			siteSize: null,
			duration: 1800,
		} );
	} );

	it.each( [
		[
			'its backup is discarded, so the latest earlier start is another backup',
			row( '1791313657.958', true ),
			SEEN_UP_TO,
		],
		[ 'it finished before every loaded start', row( '1791000000' ), SEEN_UP_TO ],
		[ 'the sizes were requested before it was seen', row( '1791313657.958' ), 1791313000 ],
	] )( 'answers null when %s', ( _, item, seenUpTo ) => {
		expect( matchBackupRun( item, RECORDS, seenUpTo ) ).toBeNull();
	} );
} );
