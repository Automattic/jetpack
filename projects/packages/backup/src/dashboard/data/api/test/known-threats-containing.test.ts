import { containingBackup } from '../known-threats';
import type { BackupsKnownThreats } from '../known-threats';

const counts = { malware: 3, database: 0, vulnerable: 1, ignored: 0, flagged: 3, fixed: 3 };
const data: BackupsKnownThreats = {
	backups: [
		{ period: 1792247305, known_threats: null },
		{ period: 1792244301, known_threats: counts },
	],
	latest_without_known_threats: 1792247305,
};

describe( 'containingBackup', () => {
	it.each( [
		[ 'its own "Backup complete" point, after the period', '1792244435.274', 1792244301 ],
		[ 'the exact period', '1792244301', 1792244301 ],
		[ 'a later point, before the next backup', '1792247000.5', 1792244301 ],
		[ 'a point in the next backup', '1792247400.1', 1792247305 ],
	] )( 'finds the backup for %s', ( _label, rewindId, period ) => {
		expect( containingBackup( data, rewindId )?.period ).toBe( period );
	} );

	it( 'finds nothing before the oldest backup, or without data', () => {
		expect( containingBackup( data, '1792200000' ) ).toBeNull();
		expect( containingBackup( null, '1792244435.274' ) ).toBeNull();
	} );
} );
