import { apiCall, apiPath } from './_helpers';

export type KnownThreatKind = 'malware' | 'database' | 'vulnerable';

/** One known Scan threat in a backup, as WordPress.com reports it. */
export type KnownThreat = {
	id: number;
	state: 'open' | 'fixed';
	kind: KnownThreatKind;
	/** Null for a database threat with no stored name. */
	signature: string | null;
	path_kind?: string;
	type?: string;
	target?: string;
	path?: string;
	slug?: string;
	version?: string;
	status?: string;
	/** UTC, usually `YYYY-MM-DD HH:MM:SS` with no zone. */
	reported_on?: string;
	fixed_on?: string | null;
};

export type KnownThreatsSummary = {
	malware: number;
	database: number;
	vulnerable: number;
	ignored: number;
	/** Malware and database threats: the ones a restore can bring back. */
	flagged: number;
	fixed: number;
};

export type KnownThreats = {
	backup_id: string;
	cutoff: string;
	summary: KnownThreatsSummary;
	threats: KnownThreat[];
	count: number;
	truncated: boolean;
};

/**
 * History state, keyed to the rewind id, that the backup details leave when their checkbox opens the
 * restore screen. Not a search param, so a crafted link can't arrive already acknowledged.
 */
export const ACKNOWLEDGED_STATE_KEY = 'jpbKnownThreatsAcknowledged';

/** How long Confirm waits for the check before restoring without it; apiFetch has no timeout. */
export const KNOWN_THREATS_TIMEOUT_MS = 12000;

/**
 * Read the known threats, or null when they cannot be read.
 *
 * @param rewindId - The backup's rewind id, in full.
 * @return The known threats, or null.
 */
async function readKnownThreats( rewindId: string ): Promise< KnownThreats | null > {
	try {
		const data = await apiCall< KnownThreats >( {
			path: apiPath( `/rewind/backups/${ rewindId }/threats` ),
		} );
		if ( typeof data?.summary?.flagged !== 'number' ) {
			return null;
		}
		return { ...data, threats: Array.isArray( data.threats ) ? data.threats : [] };
	} catch {
		return null;
	}
}

/**
 * The known Scan threats in a backup, or null when they cannot be read.
 *
 * Fails open and never rejects: a site without Scan (`threats_unavailable`), an
 * outage, an unreadable body or no answer within `KNOWN_THREATS_TIMEOUT_MS` all
 * resolve to null, and the screen restores as it always has.
 *
 * @param rewindId - The backup's rewind id, in full.
 * @return The known threats, or null.
 */
export async function fetchKnownThreats( rewindId: string ): Promise< KnownThreats | null > {
	let timer: ReturnType< typeof setTimeout > | undefined;
	const timeout = new Promise< null >( resolve => {
		timer = setTimeout( () => resolve( null ), KNOWN_THREATS_TIMEOUT_MS );
	} );
	try {
		return await Promise.race( [ readKnownThreats( rewindId ), timeout ] );
	} finally {
		clearTimeout( timer );
	}
}

/** Known-threat counts for the newest 100 backups, newest first, and the newest backup without any. */
export type BackupsKnownThreats = {
	backups: Array< { period: number; known_threats: KnownThreatsSummary | null } >;
	latest_without_known_threats: number | null;
	/** The "Backup complete" rewind id of that backup: when it finished. */
	latest_without_known_threats_rewind_id?: string | null;
};

/**
 * Known-threat counts for the newest 100 backups, or null when they cannot be read.
 *
 * @param withCleanRewindId - Also find when the newest clean backup finished, which costs a second upstream request.
 * @return The counts, or null.
 */
export async function fetchBackupsKnownThreats(
	withCleanRewindId = false
): Promise< BackupsKnownThreats | null > {
	try {
		const data = await apiCall< BackupsKnownThreats >( {
			path: apiPath(
				'/rewind/backups/known-threats',
				withCleanRewindId ? { with_clean_rewind_id: true } : undefined
			),
		} );
		if ( ! Array.isArray( data?.backups ) ) {
			return null;
		}
		return {
			backups: [ ...data.backups ].sort( ( a, b ) => b.period - a.period ),
			latest_without_known_threats: data.latest_without_known_threats ?? null,
			latest_without_known_threats_rewind_id: data.latest_without_known_threats_rewind_id ?? null,
		};
	} catch {
		return null;
	}
}

/**
 * The backup a rewind point belongs to: the newest backup at or before it.
 *
 * @param data     - Counts from `fetchBackupsKnownThreats()`.
 * @param rewindId - A rewind id, e.g. "1792244435.274".
 * @return The backup's period and counts, or null.
 */
export function containingBackup(
	data: BackupsKnownThreats | null | undefined,
	rewindId: string | undefined
): { period: number; knownThreats: KnownThreatsSummary | null } | null {
	if ( ! data || ! rewindId ) {
		return null;
	}
	const point = Math.floor( Number( rewindId ) );
	const backup = data.backups.find( candidate => candidate.period <= point );
	return backup ? { period: backup.period, knownThreats: backup.known_threats } : null;
}
