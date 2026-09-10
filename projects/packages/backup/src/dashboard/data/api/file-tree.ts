import { apiCall, apiPath, toIntRewindId } from './_helpers';

/**
 * A single entry in WPCOM's `/rewind/backup/ls` `contents` map.
 *
 * The endpoint returns `contents` as an object keyed by filename, so the
 * entry value itself has no `name` field — the parent's key carries it.
 * Type discriminators: `'dir'` (folder), `'file'` (regular file),
 * `'wordpress'` (virtual core-version marker that has no children).
 */
export type WpcomFileNode = {
	type: 'dir' | 'file' | 'wordpress' | string;
	manifest_path?: string;
	has_children?: boolean;
	total_items?: number;
	period?: string;
	id?: string;
	wordpress_version?: string;
	sort?: number;
};

export type WpcomLsResponse = {
	ok?: boolean;
	error?: string;
	contents?: Record< string, WpcomFileNode >;
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
