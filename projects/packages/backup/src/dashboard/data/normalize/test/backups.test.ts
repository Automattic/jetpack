import { normalizeBackup, normalizeBackups } from '../backups';
import type { RawBackupEntry } from '../../api/backups';

/**
 * A finished backup in the shape WPCOM actually sends — every numeric
 * and boolean column quoted, because the payload is a straight
 * serialization of VaultPress's MySQL rows.
 *
 * @param overrides - Fields to replace.
 * @return A raw entry.
 */
function entry( overrides: Partial< RawBackupEntry > = {} ): RawBackupEntry {
	return {
		id: '923254903',
		started: '2026-08-13 18:08:56',
		last_updated: '2026-08-13 18:54:14',
		status: 'finished',
		period: '1786644531',
		percent: '100',
		is_backup: '1',
		is_scan: '1',
		discarded: '0',
		stats: { prefix: 'wp_' },
		...overrides,
	};
}

describe( 'normalizeBackup', () => {
	it( 'coerces the quoted numerics WPCOM sends', () => {
		const backup = normalizeBackup( entry( { percent: '10', id: 12345 } ) );

		expect( backup.percent ).toBe( 10 );
		expect( backup.id ).toBe( '12345' );
	} );

	it( 'falls back to 0 for an unparseable percentage', () => {
		expect( normalizeBackup( entry( { percent: 'n/a' } ) ).percent ).toBe( 0 );
	} );

	// The single most likely way to get this port wrong: every non-empty
	// string is truthy, so a plain `Boolean( '0' )` reads "not discarded"
	// as "discarded" and classifies every good backup as unusable.
	it( 'reads the string "0" as false, not as a truthy string', () => {
		expect( normalizeBackup( entry( { discarded: '0' } ) ).isDiscarded ).toBe( false );
		expect( normalizeBackup( entry( { discarded: '1' } ) ).isDiscarded ).toBe( true );
	} );

	it( 'treats an absent `discarded` as not discarded', () => {
		expect( normalizeBackup( entry( { discarded: undefined } ) ).isDiscarded ).toBe( false );
	} );

	it( 'accepts the numeric spelling of the same fields', () => {
		const backup = normalizeBackup( entry( { percent: 42, is_backup: 1 } ) );

		expect( backup.percent ).toBe( 42 );
		expect( backup.isBackup ).toBe( true );
	} );

	it( 'reports an empty `stats` object as having no stats', () => {
		// WPCOM ships finished entries with `stats: {}`. They carry no
		// restore point, and the legacy hook's truthiness check lets them
		// through and then throws dereferencing `stats.plugins.count`.
		expect( normalizeBackup( entry( { stats: {} } ) ).hasStats ).toBe( false );
		expect( normalizeBackup( entry( { stats: undefined } ) ).hasStats ).toBe( false );
		expect( normalizeBackup( entry() ).hasStats ).toBe( true );
	} );
} );

describe( 'normalizeBackups', () => {
	it( 'returns an empty list when nothing has loaded', () => {
		expect( normalizeBackups( undefined ) ).toEqual( [] );
	} );

	it( 'drops scan-only rows so the newest entry is really the newest backup', () => {
		const result = normalizeBackups( [
			entry( { id: 'scan', is_backup: '0', is_scan: '1' } ),
			entry( { id: 'backup' } ),
		] );

		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ].id ).toBe( 'backup' );
	} );

	it( 'preserves WPCOM order, which is newest first', () => {
		const result = normalizeBackups( [
			entry( { id: 'newest', status: 'started' } ),
			entry( { id: 'older' } ),
		] );

		expect( result.map( backup => backup.id ) ).toEqual( [ 'newest', 'older' ] );
	} );
} );
