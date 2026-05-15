import { apiCall, apiPath, toIntRewindId } from './_helpers';

export type WpcomFileNode = {
	name: string;
	type: 'd' | 'f' | 'archive';
	manifest_path?: string;
};

export type WpcomLsResponse = {
	contents?: WpcomFileNode[];
};

/**
 * List the children of a folder inside a backup.
 *
 * @param rewindId   - The backup's rewind id (decimal suffix stripped here).
 * @param folderPath - Folder to list, relative to backup root.
 * @return The decoded WPCOM ls response.
 */
export async function fetchFileTree(
	rewindId: string,
	folderPath: string
): Promise< WpcomLsResponse > {
	return apiCall< WpcomLsResponse >( {
		path: apiPath( '/rewind/backup/ls' ),
		method: 'POST',
		data: {
			rewind_id: toIntRewindId( rewindId ),
			path: folderPath,
		},
	} );
}

export type WpcomPathInfo = {
	size?: number;
	last_modified?: string;
	mime_type?: string;
};

/**
 * Fetch metadata for a single file inside a backup.
 *
 * @param rewindId     - The backup's rewind id.
 * @param manifestPath - The file's manifest path.
 * @return The decoded WPCOM path-info response.
 */
export async function fetchPathInfo(
	rewindId: string,
	manifestPath: string
): Promise< WpcomPathInfo > {
	return apiCall< WpcomPathInfo >( {
		path: apiPath( '/rewind/backup/path-info' ),
		method: 'POST',
		data: {
			rewind_id: toIntRewindId( rewindId ),
			manifest_path: manifestPath,
		},
	} );
}
