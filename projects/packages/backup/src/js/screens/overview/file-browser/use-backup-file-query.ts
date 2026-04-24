/* eslint-disable jsdoc/require-description, jsdoc/require-param-description, jsdoc/require-returns */

import { useQuery } from '@tanstack/react-query';
import { backupFileUrlQuery } from '../../../data/query-options';
import { encodeToBase64 } from './util';

// Used by FilePreview — returns a signed URL for a single file inside
// a backup. `enabled` keeps the call off until the consumer decides the
// file is safe to preview (e.g. past the "sensitive content" gate).
/**
 *
 * @param rewindId
 * @param manifestPath
 * @param enabled
 */
export function useBackupFileQuery(
	rewindId: string | undefined,
	manifestPath: string | undefined,
	enabled: boolean
) {
	const encodedManifestPath = manifestPath ? encodeToBase64( manifestPath ) : '';
	return useQuery( {
		...backupFileUrlQuery( rewindId ?? '', encodedManifestPath ),
		enabled: enabled && !! rewindId && !! manifestPath,
	} );
}
