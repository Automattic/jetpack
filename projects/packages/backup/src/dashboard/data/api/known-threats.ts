import { apiCall, apiPath } from './_helpers';

export type KnownThreatKind = 'malware' | 'database' | 'vulnerable';

/** One known Scan threat in a backup, as WordPress.com reports it. */
export type KnownThreat = {
	id: number;
	state: 'open' | 'fixed';
	kind: KnownThreatKind;
	signature: string;
	path_kind?: string;
	type?: string;
	target?: string;
	path?: string;
	slug?: string;
	version?: string;
	status?: string;
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
