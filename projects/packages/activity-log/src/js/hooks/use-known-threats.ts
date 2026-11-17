import { queryOptions, useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { config } from '../config';

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

type BackupPeriod = { period: number; known_threats: BackupKnownThreats | null };

type KnownThreatsResponse = { backups?: BackupPeriod[] };

/**
 * The newest 100 backups with their known-threat counts, newest first. Empty when the
 * site has no Scan or the request fails: the log then shows no badges.
 *
 * @return `queryOptions` ready to pass to `useQuery`.
 */
export function knownThreatsQuery() {
	return queryOptions( {
		queryKey: [ 'jetpack-activity-log', 'known-threats' ],
		queryFn: async (): Promise< BackupPeriod[] > => {
			try {
				const response = await apiFetch< KnownThreatsResponse >( {
					path: '/jetpack/v4/activity-log/known-threats',
				} );
				return [ ...( response?.backups ?? [] ) ].sort( ( a, b ) => b.period - a.period );
			} catch {
				return [];
			}
		},
		staleTime: 5 * 60 * 1000,
		retry: false,
	} );
}

/**
 * The known threats of the backup a rewind point belongs to: the newest backup at or before it.
 *
 * @param rewindId - The row's rewind id, e.g. "1792244435.274".
 * @return The backup's counts, or undefined.
 */
export function useBackupKnownThreats( rewindId?: string ): BackupKnownThreats | undefined {
	const { data } = useQuery( { ...knownThreatsQuery(), enabled: config.knownThreatsAvailable } );
	if ( ! rewindId || ! data ) {
		return undefined;
	}
	const point = Math.floor( Number( rewindId ) );
	return data.find( backup => backup.period <= point )?.known_threats ?? undefined;
}
