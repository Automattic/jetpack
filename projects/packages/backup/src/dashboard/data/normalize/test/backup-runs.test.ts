import { matchBackupRun } from '../backup-runs';

// Starts and sizes from a live v3 response.
const RECORDS = [
	{ period: 1791312007, size: 4456295019 },
	{ period: 1791225607, size: 0 },
	{ period: 1791139207, size: 4444532929 },
];

/**
 * A backup row as `matchBackupRun` reads it.
 *
 * @param rewindId     - When the backup finished.
 * @param backupPeriod - When it started.
 * @return The row.
 */
function row( rewindId: string, backupPeriod: number | null ) {
	return { rewindId, backupPeriod };
}

describe( 'matchBackupRun', () => {
	it( 'pairs a row with the record that shares its start', () => {
		expect( matchBackupRun( row( '1791313657.958', 1791312007 ), RECORDS ) ).toEqual( {
			siteSize: 4456295019,
			duration: 1651,
		} );
	} );

	it( 'keeps the duration when WordPress.com reports a size of 0', () => {
		expect( matchBackupRun( row( '1791227407', 1791225607 ), RECORDS ) ).toEqual( {
			siteSize: null,
			duration: 1800,
		} );
	} );

	it.each( [
		[
			'its record is missing, though the backup before it has one',
			row( '1791313657.958', 1791311000 ),
		],
		[ 'WordPress.com sent no start for it', row( '1791313657.958', null ) ],
	] )( 'answers null when %s', ( _, item ) => {
		expect( matchBackupRun( item, RECORDS ) ).toBeNull();
	} );
} );
