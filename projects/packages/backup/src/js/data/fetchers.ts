/* eslint-disable jsdoc/require-description, jsdoc/require-param-description, jsdoc/require-returns */

import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import {
	isMockMode,
	mockActivityLogResponse,
	mockBackupLs,
	mockBackupPathInfo,
	mockBackups,
	mockPolicies,
	mockSize,
} from './mock';
import type {
	ActivityLogResponse,
	BackupDownloadStatusResponse,
	BackupItemUrl,
	BackupLsResponse,
	BackupPathInfoResponse,
	BackupEntry,
	DownloadConfig,
	DownloadProgress,
	DownloadStatusResponse,
	PrepareBackupDownloadResponse,
	RestoreConfig,
	RestoreInitiateResponse,
	RestoreProgress,
	SiteRewindPoliciesResponse,
	SiteRewindSizeResponse,
} from './types';

// Activity-log rewind IDs carry a decimal suffix (e.g. "1777035492.615")
// — the sub-second portion WPCOM's activity service uses to disambiguate
// events that share a second. The `rewind/backup/*` endpoints only
// accept the integer-second portion of the rewind id in their URL and
// return 404 otherwise. Strip the fractional part at the fetcher
// boundary so every caller gets the right behaviour for free.
const toIntRewindId = ( rewindId: string ): string => {
	const idx = rewindId.indexOf( '.' );
	return idx === -1 ? rewindId : rewindId.slice( 0, idx );
};

// All fetchers target local `/jetpack/v4/…` endpoints that proxy to
// WPCOM using the site's Jetpack connection. `siteId` is resolved
// server-side, so it is not part of any path or argument here.
//
// When `isMockMode()` is true (via the `?jpb-mock=1` URL param) the
// fetchers short-circuit to fixtures from `./mock` so the Overview can
// be designed and QAed without a real backup plan on the site.

/**
 *
 */
export async function fetchBackups(): Promise< BackupEntry[] > {
	if ( isMockMode() ) {
		return mockBackups;
	}
	return apiFetch< BackupEntry[] >( { path: '/jetpack/v4/backups' } );
}

/**
 *
 * @param root0
 * @param root0.number
 * @param root0.aggregate
 * @param root0.after
 * @param root0.before
 */
export async function fetchActivityLog( {
	number = 1000,
	aggregate = false,
	after,
	before,
}: {
	number?: number;
	aggregate?: boolean;
	after?: string;
	before?: string;
} = {} ): Promise< ActivityLogResponse > {
	if ( isMockMode() ) {
		return mockActivityLogResponse;
	}
	const path = addQueryArgs( '/jetpack/v4/site/backup/activity-log', {
		number,
		aggregate,
		after,
		before,
	} );
	return apiFetch< ActivityLogResponse >( { path } );
}

/**
 *
 */
export async function fetchBackupPolicies(): Promise< SiteRewindPoliciesResponse > {
	if ( isMockMode() ) {
		return mockPolicies;
	}
	return apiFetch< SiteRewindPoliciesResponse >( { path: '/jetpack/v4/site/backup/policies' } );
}

/**
 *
 */
export async function fetchBackupSize(): Promise< SiteRewindSizeResponse > {
	if ( isMockMode() ) {
		return mockSize;
	}
	return apiFetch< SiteRewindSizeResponse >( { path: '/jetpack/v4/site/backup/size' } );
}

/**
 *
 * @param root0
 * @param root0.rewindId
 * @param root0.path
 */
export async function fetchBackupLs( {
	rewindId,
	path = '/',
}: {
	rewindId: string;
	path?: string;
} ): Promise< BackupLsResponse > {
	if ( isMockMode() ) {
		return mockBackupLs( rewindId, path );
	}
	const requestPath = addQueryArgs( '/jetpack/v4/site/backup/ls', {
		rewind_id: toIntRewindId( rewindId ),
		path,
	} );
	return apiFetch< BackupLsResponse >( { path: requestPath } );
}

/**
 *
 * @param root0
 * @param root0.rewindId
 * @param root0.manifestPath
 * @param root0.extensionType
 */
export async function fetchBackupPathInfo( {
	rewindId,
	manifestPath,
	extensionType = '',
}: {
	rewindId: string;
	manifestPath: string;
	extensionType?: string;
} ): Promise< BackupPathInfoResponse > {
	if ( isMockMode() ) {
		return mockBackupPathInfo( rewindId, manifestPath, extensionType );
	}
	const requestPath = addQueryArgs( '/jetpack/v4/site/backup/path-info', {
		rewind_id: toIntRewindId( rewindId ),
		manifest_path: manifestPath,
		extension_type: extensionType,
	} );
	return apiFetch< BackupPathInfoResponse >( { path: requestPath } );
}

/**
 *
 * @param root0
 * @param root0.rewindId
 * @param root0.encodedManifestPath
 */
export async function fetchBackupFileUrl( {
	rewindId,
	encodedManifestPath,
}: {
	rewindId: string;
	encodedManifestPath: string;
} ): Promise< BackupItemUrl > {
	if ( isMockMode() ) {
		return { url: `about:blank#mock-${ encodedManifestPath }` };
	}
	const requestPath = addQueryArgs( '/jetpack/v4/site/backup/file-url', {
		rewind_id: toIntRewindId( rewindId ),
		encoded_manifest_path: encodedManifestPath,
	} );
	return apiFetch< BackupItemUrl >( { path: requestPath } );
}

/**
 *
 * @param root0
 * @param root0.rewindId
 * @param root0.encodedManifestPath
 */
export async function fetchBackupFileContent( {
	rewindId,
	encodedManifestPath,
}: {
	rewindId: string;
	encodedManifestPath: string;
} ): Promise< { content: string } > {
	const requestPath = addQueryArgs( '/jetpack/v4/site/backup/file-content', {
		rewind_id: toIntRewindId( rewindId ),
		encoded_manifest_path: encodedManifestPath,
	} );
	return apiFetch< { content: string } >( { path: requestPath } );
}

/**
 *
 * @param root0
 * @param root0.period
 * @param root0.archiveType
 * @param root0.extensionSlug
 * @param root0.extensionVersion
 */
export async function fetchBackupExtensionUrl( {
	period,
	archiveType,
	extensionSlug,
	extensionVersion = '',
}: {
	period: string;
	archiveType: string;
	extensionSlug: string;
	extensionVersion?: string;
} ): Promise< BackupItemUrl > {
	if ( isMockMode() ) {
		return { url: `about:blank#mock-${ extensionSlug }` };
	}
	const requestPath = addQueryArgs( '/jetpack/v4/site/backup/extension-url', {
		period,
		archive_type: archiveType,
		extension_slug: extensionSlug,
		extension_version: extensionVersion,
	} );
	return apiFetch< BackupItemUrl >( { path: requestPath } );
}

/**
 *
 * @param root0
 * @param root0.rewindId
 * @param root0.types
 * @param root0.includePaths
 * @param root0.excludePaths
 */
export async function initiateBackupDownload( {
	rewindId,
	types,
	includePaths,
	excludePaths,
}: {
	rewindId: string;
	types?: DownloadConfig;
	includePaths?: string;
	excludePaths?: string;
} ): Promise< number > {
	const body: Record< string, unknown > = { rewind_id: rewindId };
	if ( includePaths ) {
		body.include_path_list = includePaths;
		body.exclude_path_list = excludePaths ?? '';
	} else {
		body.types = types ?? {};
	}
	const data = await apiFetch< DownloadStatusResponse >( {
		path: '/jetpack/v4/site/backup/download',
		method: 'POST',
		data: body,
	} );
	return data.downloadId;
}

/**
 *
 * @param downloadId
 */
export async function fetchBackupDownloadProgress(
	downloadId: number
): Promise< DownloadProgress > {
	const path = addQueryArgs( '/jetpack/v4/site/backup/download/progress', {
		download_id: downloadId,
	} );
	const data = await apiFetch< DownloadStatusResponse >( { path } );

	// WPCOM returns camelCase; the rest of the app (and the type we expose
	// here) mirrors Calypso's snake_case shape. Normalise once at the edge.
	const {
		downloadId: id = 0,
		rewindId = '',
		backupPoint = '',
		startedAt = '',
		progress = 0,
		downloadCount = 0,
		validUntil = '',
		url = '',
		bytes = 0,
		bytesFormatted = '',
		code = '',
		message = '',
	} = data || ( {} as DownloadStatusResponse );

	return {
		download_id: id,
		rewind_id: rewindId,
		backup_point: backupPoint,
		started_at: startedAt,
		progress,
		download_count: downloadCount,
		valid_until: validUntil,
		url,
		bytes,
		bytes_formatted: bytesFormatted,
		error: code ? { code, message } : undefined,
	};
}

/**
 *
 * @param root0
 * @param root0.rewindId
 * @param root0.manifestFilter
 * @param root0.dataType
 */
export async function prepareBackupDownload( {
	rewindId,
	manifestFilter,
	dataType,
}: {
	rewindId: string;
	manifestFilter: string;
	dataType: number;
} ): Promise< PrepareBackupDownloadResponse > {
	return apiFetch< PrepareBackupDownloadResponse >( {
		path: '/jetpack/v4/site/backup/filtered/prepare',
		method: 'POST',
		data: {
			rewind_id: rewindId,
			manifest_filter: manifestFilter,
			data_type: dataType,
		},
	} );
}

/**
 *
 * @param root0
 * @param root0.key
 * @param root0.dataType
 */
export async function fetchBackupFilteredDownloadStatus( {
	key,
	dataType,
}: {
	key: string;
	dataType: number;
} ): Promise< BackupDownloadStatusResponse > {
	return apiFetch< BackupDownloadStatusResponse >( {
		path: '/jetpack/v4/site/backup/filtered/status',
		method: 'POST',
		data: { key, data_type: dataType },
	} );
}

/**
 *
 */
export async function enqueueBackup(): Promise< void > {
	if ( isMockMode() ) {
		return;
	}
	await apiFetch( {
		path: '/jetpack/v4/site/backup/enqueue',
		method: 'POST',
	} );
}

// Restore-flow fetchers — same shape as the download fetchers above.
// `includePaths` (when set) flips the bridge into granular mode and the
// `types` value is ignored on the server side.

/**
 *
 * @param root0
 * @param root0.rewindId
 * @param root0.types
 * @param root0.includePaths
 * @param root0.excludePaths
 */
export async function initiateBackupRestore( {
	rewindId,
	types,
	includePaths,
	excludePaths,
}: {
	rewindId: string;
	types?: RestoreConfig;
	includePaths?: string;
	excludePaths?: string;
} ): Promise< number > {
	if ( isMockMode() ) {
		// Mock mode short-circuits with a fake restore id; the progress
		// fetcher handles the rest of the simulation.
		return 1;
	}
	const body: Record< string, unknown > = { rewind_id: rewindId };
	if ( includePaths ) {
		body.include_path_list = includePaths;
		body.exclude_path_list = excludePaths ?? '';
	} else {
		body.types = types ?? {};
	}
	const data = await apiFetch< RestoreInitiateResponse >( {
		path: '/jetpack/v4/site/backup/restore',
		method: 'POST',
		data: body,
	} );
	return data.id;
}

/**
 *
 * @param restoreId
 */
export async function fetchBackupRestoreProgress( restoreId: number ): Promise< RestoreProgress > {
	if ( isMockMode() ) {
		// Pretend the restore finishes after the first poll.
		return {
			restore_id: restoreId,
			status: 'finished',
			progress: 100,
		};
	}
	const path = addQueryArgs( '/jetpack/v4/site/backup/restore/progress', {
		restore_id: restoreId,
	} );
	const data = await apiFetch< {
		id?: number;
		status?: 'queued' | 'running' | 'finished' | 'fail';
		progress?: number;
		error_code?: string;
		reason?: string;
		message?: string;
	} >( { path } );

	return {
		restore_id: data?.id ?? restoreId,
		status: data?.status ?? 'queued',
		progress: typeof data?.progress === 'number' ? data.progress : 0,
		error_code: data?.error_code,
		reason: data?.reason,
		message: data?.message,
	};
}
