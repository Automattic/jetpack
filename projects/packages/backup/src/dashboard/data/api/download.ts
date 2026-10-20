import { __ } from '@wordpress/i18n';
import { ApiError, apiCall, apiPath, requireTypes } from './_helpers';
import { sameRewindId } from './restore';
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
 * `expired` is a built archive whose link has lapsed.
 */
export type DownloadStatus = 'running' | 'finished' | 'failed' | 'expired';

export type DownloadStatusResponse = {
	id: number;
	/** The backup this download is of, or empty when WPCOM did not say. */
	rewind_id: string;
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

/**
 * The site's latest downloads, as WPCOM lists them.
 *
 * @return The downloads, each projected as a status read is.
 */
export async function fetchDownloads(): Promise< DownloadStatusResponse[] > {
	return apiCall< DownloadStatusResponse[] >( { path: apiPath( '/backups/downloads' ) } );
}

/**
 * The newest download of this backup still worth showing: one being built, or one ready to fetch.
 *
 * @param downloads - The downloads list, if it has answered.
 * @param rewindId  - The backup on screen.
 * @return The download, or null when there is none to resume.
 */
export function pickResumableDownload(
	downloads: DownloadStatusResponse[] | undefined,
	rewindId: string
): DownloadStatusResponse | null {
	// Anything but a list means nothing to resume, not a broken screen.
	const newest = ( Array.isArray( downloads ) ? downloads : [] )
		.filter( download => sameRewindId( download.rewind_id, rewindId ) )
		.sort( ( a, b ) => b.id - a.id )[ 0 ];

	return newest?.status === 'running' || newest?.status === 'finished' ? newest : null;
}
