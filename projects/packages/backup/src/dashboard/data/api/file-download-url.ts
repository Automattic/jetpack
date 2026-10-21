import { apiCall, apiPath } from './_helpers';

/**
 * Ask the bridge for a one-file download link.
 *
 * Call on click only. The link is a bearer credential: anyone holding it can read the file.
 *
 * @param filePeriod          - The file's own snapshot timestamp from `/ls`.
 * @param encodedManifestPath - Standard base64 of the full manifest path.
 * @return The signed URL.
 */
export async function fetchFileDownloadUrl(
	filePeriod: string,
	encodedManifestPath: string
): Promise< string > {
	const { url } = await apiCall< { url: string } >( {
		path: apiPath( '/rewind/backup/file-download-url', {
			file_period: filePeriod,
			encoded_manifest_path: encodedManifestPath,
		} ),
	} );
	return url;
}
