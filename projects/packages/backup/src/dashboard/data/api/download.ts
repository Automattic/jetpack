import { apiCall, apiPath, requireTypes } from './_helpers';
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
