import { apiCall, apiPath, toIntRewindId } from './_helpers';

export type FileContentsResponse = {
	content: string;
};

/**
 * Fetch a text file's contents via the proxy (WPCOM signed URL + 64KB cap).
 *
 * @param rewindId            - The backup's rewind id.
 * @param encodedManifestPath - Base64-encoded manifest path.
 * @return The decoded file content.
 */
export async function fetchFileContents(
	rewindId: string,
	encodedManifestPath: string
): Promise< FileContentsResponse > {
	return apiCall< FileContentsResponse >( {
		path: apiPath( '/rewind/backup/file-content', {
			rewind_id: toIntRewindId( rewindId ),
			encoded_manifest_path: encodedManifestPath,
		} ),
	} );
}
