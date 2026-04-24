import { queryOptions } from '@tanstack/react-query';
import {
	fetchActivityLog,
	fetchBackupExtensionUrl,
	fetchBackupFileUrl,
	fetchBackupLs,
	fetchBackupPathInfo,
	fetchBackupPolicies,
	fetchBackupSize,
	fetchBackups,
} from './fetchers';

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

// File-browser queries. Backups are immutable, so ls / path-info results
// are safe to cache forever; TanStack won't refetch on focus or remount.
// file-url is one-time and signed — we skip any persist behaviour so a
// stale URL never leaks across sessions.

export const backupLsQuery = ( rewindId: string, path: string = '/' ) =>
	queryOptions( {
		queryKey: [ 'jetpack-backup', 'ls', rewindId, path ],
		queryFn: () => fetchBackupLs( { rewindId, path } ),
		staleTime: Infinity,
	} );

export const backupPathInfoQuery = (
	rewindId: string,
	manifestPath: string,
	extensionType: string = ''
) =>
	queryOptions( {
		queryKey: [ 'jetpack-backup', 'path-info', rewindId, manifestPath, extensionType ],
		queryFn: () => fetchBackupPathInfo( { rewindId, manifestPath, extensionType } ),
		staleTime: Infinity,
	} );

export const backupFileUrlQuery = ( rewindId: string, encodedManifestPath: string ) =>
	queryOptions( {
		queryKey: [ 'jetpack-backup', 'file-url', rewindId, encodedManifestPath ],
		queryFn: () => fetchBackupFileUrl( { rewindId, encodedManifestPath } ),
		staleTime: Infinity,
	} );

export const backupExtensionUrlQuery = (
	period: string,
	archiveType: string,
	extensionSlug: string,
	extensionVersion: string = ''
) =>
	queryOptions( {
		queryKey: [
			'jetpack-backup',
			'extension-url',
			period,
			archiveType,
			extensionSlug,
			extensionVersion,
		],
		queryFn: () =>
			fetchBackupExtensionUrl( { period, archiveType, extensionSlug, extensionVersion } ),
		staleTime: Infinity,
	} );
