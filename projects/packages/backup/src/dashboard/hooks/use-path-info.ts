import { useQuery } from '@tanstack/react-query';
import { fetchPathInfo, type WpcomPathInfo } from '../data/api/file-tree';

type Result = {
	data: WpcomPathInfo | undefined;
	isLoading: boolean;
	error: Error | null;
};

/**
 * Hook fetching path-info metadata (size, mime type, last modified) for
 * a single file inside a backup.
 *
 * `useFileTree` doesn't return mime + size on its tree entries — WPCOM's
 * `/rewind/backup/ls` only ships `name` + `type`. Path-info is a
 * per-file follow-up call that the FileInfoCard issues on open.
 *
 * @param rewindId     - The backup's rewind id.
 * @param manifestPath - The file's manifest path, or null when no file is open.
 * @return Path-info query state.
 */
export function usePathInfo( rewindId: string, manifestPath: string | null ): Result {
	const query = useQuery( {
		queryKey: [ 'backup', 'path-info', rewindId, manifestPath ] as const,
		queryFn: () => fetchPathInfo( rewindId, manifestPath as string ),
		enabled: Boolean( rewindId ) && Boolean( manifestPath ),
	} );
	return {
		data: query.data,
		isLoading: query.isLoading,
		error: query.error ?? null,
	};
}
