import { useQuery } from '@tanstack/react-query';
import { fetchFileContents } from '../data/api/file-contents';
import { keys } from '../data/query-client';

type Result = {
	content: string | null;
	isLoading: boolean;
	error: Error | null;
};

/**
 * Base64-encode a manifest path the way WPCOM's file-content endpoint
 * expects. Uses `window.btoa` in the browser and falls back to Node's
 * `Buffer` for tests/SSR.
 *
 * @param manifestPath - The raw manifest path.
 * @return Base64-encoded path.
 */
function encodeManifestPath( manifestPath: string ): string {
	if ( typeof window !== 'undefined' && typeof window.btoa === 'function' ) {
		return window.btoa( manifestPath );
	}
	return Buffer.from( manifestPath, 'utf-8' ).toString( 'base64' );
}

/**
 * Hook fetching a text file's contents for the preview pane.
 *
 * @param rewindId     - The backup's rewind id.
 * @param manifestPath - The file's manifest path (NOT base64-encoded — encoded here).
 * @param enabled      - When false, the query is skipped (e.g. binary mime types).
 * @return Content + loading state.
 */
export function useFileContents(
	rewindId: string,
	manifestPath: string | null,
	enabled: boolean
): Result {
	const query = useQuery( {
		queryKey: keys.fileContents( rewindId, manifestPath ?? '' ),
		queryFn: () => fetchFileContents( rewindId, encodeManifestPath( manifestPath ?? '' ) ),
		enabled: enabled && Boolean( rewindId ) && Boolean( manifestPath ),
	} );

	return {
		content: query.data?.content ?? null,
		isLoading: query.isLoading,
		error: query.error ?? null,
	};
}
