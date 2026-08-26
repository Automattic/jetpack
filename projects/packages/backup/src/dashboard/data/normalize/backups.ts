import type { Backup } from '../../types/backup';
import type { RawBackupEntry } from '../api/backups';

/**
 * Coerce WPCOM's stringly-typed numerics to a number.
 *
 * `percent` arrives as `"10"` from WPCOM and as `10` from the legacy
 * fixtures. `Number( undefined )` is `NaN`, which would silently poison
 * a progress bar, so anything unparseable becomes 0.
 *
 * @param value - Raw field value.
 * @return A finite number, defaulting to 0.
 */
function toNumber( value: unknown ): number {
	const parsed = Number( value );
	return Number.isFinite( parsed ) ? parsed : 0;
}

/**
 * Coerce WPCOM's stringly-typed booleans.
 *
 * The wire carries `"1"` / `"0"` for `is_backup`, `is_scan` and
 * `discarded`. A plain truthiness test would read `"0"` as true, since
 * every non-empty string is truthy — the single most likely way to get
 * this wrong.
 *
 * @param value - Raw field value.
 * @return The boolean meaning, defaulting to false when absent.
 */
function toBoolean( value: unknown ): boolean {
	if ( typeof value === 'string' ) {
		return value !== '' && value !== '0';
	}
	return Boolean( value );
}

/**
 * Convert one raw entry into the UI's `Backup` shape.
 *
 * `isDiscarded` defaults to **false** when the field is absent, which is
 * a deliberate divergence from the legacy hook. There, the check is
 * `'0' === backup.discarded`, so an absent field reads as *discarded*.
 * That only ever fires on non-finished entries — which are excluded a
 * step earlier anyway — so the two agree in practice, but the legacy
 * spelling arrives at the right answer by accident and inverts the
 * meaning of a missing field.
 *
 * Timestamps are deliberately not carried over. `started` and
 * `last_updated` are MySQL `DATETIME` strings in UTC with no offset
 * designator, and both `new Date()` and `@wordpress/date` parse that as
 * browser-local — the legacy hook appends `'+00:00'` before handing the
 * value over for exactly this reason. Anything adding these fields must
 * normalize them at this boundary rather than at the point of display.
 *
 * @param entry - Raw WPCOM entry.
 * @return The normalized backup.
 */
export function normalizeBackup( entry: RawBackupEntry ): Backup {
	return {
		id: String( entry.id ),
		status: entry.status,
		percent: toNumber( entry.percent ),
		isBackup: toBoolean( entry.is_backup ),
		isDiscarded: toBoolean( entry.discarded ),
		hasStats: Boolean( entry.stats && Object.keys( entry.stats ).length > 0 ),
	};
}

/**
 * Normalize the backup list, dropping the scan-only rows.
 *
 * This endpoint returns scan records alongside backups, distinguished
 * only by `is_backup` / `is_scan`. The legacy hook reads `backups[0]` as
 * "the latest backup" without filtering, so on a site with Scan a scan
 * row can stand in for a backup; `my-jetpack` filters on `is_backup`
 * before taking the latest, and that is the behaviour ported here.
 *
 * Order is preserved. WPCOM returns newest first, which every consumer
 * in the repo relies on — including the legacy hook's "only the first
 * backup can be in progress".
 *
 * @param entries - Raw WPCOM entries, or undefined before the first load.
 * @return Normalized backups, newest first.
 */
export function normalizeBackups( entries: RawBackupEntry[] | undefined ): Backup[] {
	if ( ! entries ) {
		return [];
	}
	return entries.map( normalizeBackup ).filter( backup => backup.isBackup );
}
