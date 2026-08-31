import { apiCall, apiPath } from './_helpers';

/**
 * WPCOM's raw `/rewind/backup/path-info` payload.
 *
 * Every field is optional because upstream answers HTTP 200 with only
 * an `error` string when the file has no row for the period asked for —
 * a caller has to branch on `error`, not on the status code.
 *
 * Two fields are returned but deliberately unused here. `download_url`
 * is hardcoded empty upstream behind a TODO, so it carries no signal
 * about whether the bytes exist. `data_type` is a small integer type
 * code taken from the manifest path's second character, not a mime
 * type; it exists to drive granular download, and the info card keeps
 * deriving previewability from the file extension the way Calypso does.
 */
export type PathInfoResponse = {
	error?: string;
	size?: number;
	hash?: string;
	mtime?: number;
	data_type?: number;
	manifest_filter?: string;
	download_url?: string;
};

/**
 * Fetch one file's recorded metadata.
 *
 * `filePeriod` is the file's own snapshot timestamp from `/ls`, NOT the
 * parent backup's rewindId: VaultPress stores one row per file version
 * and matches the period exactly, so a file that did not change during
 * the backup being browsed has no row under that backup's id.
 *
 * `manifestPath` goes raw — this route carries it in the request body,
 * unlike the file-content route, which base64-encodes it into a URL
 * segment.
 *
 * @param filePeriod    - The file's own snapshot timestamp (Unix seconds, from /ls's `period`).
 * @param manifestPath  - The volume-prefixed manifest path, unencoded (e.g. `f5:/wp-config.php`).
 * @param extensionType - Optional extension filter (`changed` | `unchanged`).
 * @return The raw path-info payload.
 */
export async function fetchPathInfo(
	filePeriod: string,
	manifestPath: string,
	extensionType = ''
): Promise< PathInfoResponse > {
	return apiCall< PathInfoResponse >( {
		path: apiPath( '/rewind/backup/path-info', {
			file_period: filePeriod,
			manifest_path: manifestPath,
			extension_type: extensionType,
		} ),
	} );
}
