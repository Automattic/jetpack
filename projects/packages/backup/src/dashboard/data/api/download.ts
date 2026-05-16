import { apiCall, apiPath, toIntRewindId } from './_helpers';

export type InitiateDownloadResponse = {
	id: number;
};

export type DownloadStatusResponse = {
	url?: string;
	valid_until?: string;
	progress?: number;
	status: 'in-progress' | 'completed' | 'failed' | string;
};

/**
 * Initiate a backup download.
 *
 * @param rewindId - The backup's rewind id.
 * @return The download id.
 */
export async function initiateDownload( rewindId: string ): Promise< InitiateDownloadResponse > {
	return apiCall< InitiateDownloadResponse >( {
		path: apiPath( `/backups/download/${ toIntRewindId( rewindId ) }` ),
		method: 'POST',
	} );
}

/**
 * Poll status for an in-flight download.
 *
 * @param rewindId   - The backup's rewind id.
 * @param downloadId - The download id returned by `initiateDownload`.
 * @return The current download state.
 */
export async function fetchDownloadStatus(
	rewindId: string,
	downloadId: number
): Promise< DownloadStatusResponse > {
	return apiCall< DownloadStatusResponse >( {
		path: apiPath( `/backups/download/${ toIntRewindId( rewindId ) }/status`, {
			download_id: downloadId,
		} ),
	} );
}
