import { apiCall, apiPath } from './_helpers';

export type FileContentsResponse = {
	content: string;
};

/**
 * Fetch a text file's contents via the proxy (WPCOM signed URL + 64KB cap).
 *
 * `filePeriod` is the file's own snapshot timestamp from `/ls` — NOT
 * the parent backup's rewindId. VaultPress stores file content per the
 * file's own period, so passing the parent rewindId here silently
 * produces a signed URL for a non-existent storage location.
 *
 * @param filePeriod          - The file's own snapshot timestamp (Unix seconds, as returned in /ls's `period`).
 * @param encodedManifestPath - Standard base64 of the full manifest path (with `f5:/`-style volume prefix).
 * @return The decoded file content.
 */
export async function fetchFileContents(
	filePeriod: string,
	encodedManifestPath: string
): Promise< FileContentsResponse > {
	return apiCall< FileContentsResponse >( {
		path: apiPath( '/rewind/backup/file-content', {
			file_period: filePeriod,
			encoded_manifest_path: encodedManifestPath,
		} ),
	} );
}
