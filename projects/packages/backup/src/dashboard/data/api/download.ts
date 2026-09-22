import { __ } from '@wordpress/i18n';
import { ApiError, apiCall, apiPath, requireTypes } from './_helpers';
import type { RestoreItems } from '../../types/restore';

export type InitiateDownloadResponse = {
	id: number;
};

/**
 * Lifecycle of a download, derived by the bridge.
 *
 * WPCOM's own payload carries no status field. It returns a base object
 * and attaches further keys according to where the download has got to —
 * `url` and `validUntil` once the archive is ready, `error` when it
 * failed, and `progress` only while it is still being built. The bridge
 * reads which of those arrived and reports it as one of these instead,
 * so the client never has to infer lifecycle from field presence.
 */
export type DownloadStatus = 'running' | 'finished' | 'failed';

export type DownloadStatusResponse = {
	id: number;
	status: DownloadStatus;
	/** 0–100. Absent upstream once the download finishes or fails; the bridge sends 0. */
	progress: number;
	/** Signed archive URL. Only present once `status` is `finished`. */
	url: string;
	/** ISO-8601 expiry of `url`, or empty. */
	valid_until: string;
	/** WPCOM's reason, only when `status` is `failed`. */
	error: string;
};

/**
 * Initiate a backup download.
 *
 * Always names at least one category — `requireTypes` throws instead of
 * letting the key be dropped, because an absent `types` asks WPCOM for
 * the *whole* archive rather than for nothing.
 *
 * @param rewindId - The backup's rewind id, in full — the decimal suffix is significant.
 * @param types    - Which categories to include in the download.
 * @return The download id.
 */
export async function initiateDownload(
	rewindId: string,
	types: RestoreItems
): Promise< InitiateDownloadResponse > {
	return apiCall< InitiateDownloadResponse >( {
		path: apiPath( `/backups/download/${ rewindId }` ),
		method: 'POST',
		data: { types: requireTypes( types ) },
	} );
}

/**
 * The `ls` entry ids carried in a `?files=` param.
 *
 * The comma is upstream's own separator: a folder's id is the joined ids
 * of the entries it covers, so splitting yields exactly those entries.
 *
 * @param files - The comma-joined `?files=` value.
 * @return One trimmed, non-empty entry per id.
 */
export function splitFileSelection( files: string ): string[] {
	return files
		.split( ',' )
		.map( part => part.trim() )
		.filter( Boolean );
}

/**
 * Initiate a download scoped to named files.
 *
 * `types: { paths: true }` and nothing else — the bridge refuses any other
 * pairing, and upstream would not.
 *
 * @param  rewindId - The backup's rewind id, in full.
 * @param  files    - The comma-joined `ls` entry ids the file browser produced.
 * @throws {ApiError} When the selection names no entry.
 * @return The download id.
 */
export async function initiateFileDownload(
	rewindId: string,
	files: string
): Promise< InitiateDownloadResponse > {
	const paths = splitFileSelection( files );
	if ( ! paths.length ) {
		throw new ApiError(
			'no_files_selected',
			__( 'Select at least one file to download.', 'jetpack-backup-pkg' )
		);
	}

	return apiCall< InitiateDownloadResponse >( {
		path: apiPath( `/backups/download/${ rewindId }` ),
		method: 'POST',
		data: { types: { paths: true }, include_path_list: paths },
	} );
}

/**
 * Poll status for an in-flight download.
 *
 * @param rewindId   - The backup's rewind id, in full.
 * @param downloadId - The download id returned by `initiateDownload`.
 * @return The current download state.
 */
export async function fetchDownloadStatus(
	rewindId: string,
	downloadId: number
): Promise< DownloadStatusResponse > {
	return apiCall< DownloadStatusResponse >( {
		path: apiPath( `/backups/download/${ rewindId }/status`, {
			download_id: downloadId,
		} ),
	} );
}
