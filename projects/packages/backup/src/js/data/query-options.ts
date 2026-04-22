import { queryOptions } from '@tanstack/react-query';
import { fetchActivityLog, fetchBackupPolicies, fetchBackupSize, fetchBackups } from './fetchers';

// Query keys are stable tuples so TanStack's invalidation can target a
// specific set. We prefix every key with `jetpack-backup` to avoid
// collisions with any other query caches that may coexist in the same
// QueryClient in future.

export const backupsQuery = () =>
	queryOptions( {
		queryKey: [ 'jetpack-backup', 'backups' ],
		queryFn: fetchBackups,
	} );

export const activityLogQuery = (
	number: number = 1000,
	aggregate: boolean = false,
	after?: string,
	before?: string
) =>
	queryOptions( {
		queryKey: [ 'jetpack-backup', 'activity-log', number, aggregate, after, before ],
		queryFn: () => fetchActivityLog( { number, aggregate, after, before } ),
		select: data => data.current?.orderedItems?.slice( 0, number ) ?? [],
	} );

export const backupPoliciesQuery = () =>
	queryOptions( {
		queryKey: [ 'jetpack-backup', 'policies' ],
		queryFn: fetchBackupPolicies,
		staleTime: Infinity,
	} );

export const backupSizeQuery = () =>
	queryOptions( {
		queryKey: [ 'jetpack-backup', 'size' ],
		queryFn: fetchBackupSize,
	} );
