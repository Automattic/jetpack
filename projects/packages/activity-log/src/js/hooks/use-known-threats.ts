import { queryOptions, useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';

/** Known Scan threat counts for one backup, as WordPress.com reports them. */
export type BackupKnownThreats = {
	malware: number;
	database: number;
	vulnerable: number;
	ignored: number;
	/** Malware and database threats: the ones a restore can bring back. */
	flagged: number;
	fixed: number;
};

type KnownThreatsResponse = {
	backups?: Array< { period: number; known_threats: BackupKnownThreats } >;
};

/**
 * Flagged backups of the newest 100, keyed by backup period. Empty when the site
 * has no Scan, isn't a WoW site, or the request fails: the log then shows no badges.
 *
 * @return `queryOptions` ready to pass to `useQuery`.
 */
export function knownThreatsQuery() {
	return queryOptions( {
		queryKey: [ 'jetpack-activity-log', 'known-threats' ],
		queryFn: async (): Promise< Map< number, BackupKnownThreats > > => {
			try {
				const response = await apiFetch< KnownThreatsResponse >( {
					path: '/jetpack/v4/activity-log/known-threats',
				} );
				return new Map(
					( response?.backups ?? [] ).map( backup => [ backup.period, backup.known_threats ] )
				);
			} catch {
				return new Map();
			}
		},
		staleTime: 5 * 60 * 1000,
		retry: false,
	} );
}

/**
 * The known threats of the backup a row's rewind point is, if it is a flagged backup.
 *
 * @param rewindId - The row's rewind id, e.g. "1792244435.274".
 * @return The backup's counts, or undefined.
 */
export function useBackupKnownThreats( rewindId?: string ): BackupKnownThreats | undefined {
	const { data } = useQuery( knownThreatsQuery() );
	if ( ! rewindId || ! data ) {
		return undefined;
	}
	return data.get( Math.floor( Number( rewindId ) ) );
}
