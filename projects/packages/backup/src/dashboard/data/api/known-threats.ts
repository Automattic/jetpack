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

/**
 * The known Scan threats in a backup, or null when they cannot be read.
 *
 * Fails open: a site without Scan (`threats_unavailable`), an outage or an
 * unreadable body all resolve to null, and the screen restores as it always has.
 *
 * @param rewindId - The backup's rewind id, in full.
 * @return The known threats, or null.
 */
export async function fetchKnownThreats( rewindId: string ): Promise< KnownThreats | null > {
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
