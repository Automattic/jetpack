import { useQuery } from '@tanstack/react-query';
import { useMemo } from '@wordpress/element';
import { fetchFileTree, type WpcomFileNode } from '../data/api/file-tree';
import { keys } from '../data/query-client';
import type { FileNode } from '../types/file-tree';

const BASE_FOLDER_PATH = '/';

type Result = {
	children: FileNode[] | null;
	isLoading: boolean;
	error: Error | null;
};

/**
 * Convert a raw WPCOM ls node into the dashboard's `FileNode` shape, joining
 * the child's name onto the parent path so callers see absolute paths.
 *
 * @param raw        - The WPCOM ls entry.
 * @param parentPath - Path of the folder the entry lives in.
 * @return The mapped `FileNode`.
 */
function toFileNode( raw: WpcomFileNode, parentPath: string ): FileNode {
	const fullPath =
		parentPath === BASE_FOLDER_PATH ? `/${ raw.name }` : `${ parentPath }/${ raw.name }`;

	if ( raw.type === 'd' || raw.type === 'archive' ) {
		return {
			type: 'folder',
			name: raw.name,
			path: fullPath,
		};
	}
	return {
		type: 'file',
		name: raw.name,
		path: fullPath,
		sizeBytes: 0,
		mimeType: 'application/octet-stream',
	};
}

/**
 * Hook returning the children of a folder inside a backup.
 *
 * Passing `null` for `folderPath` is the "ask for the root tree" idiom;
 * the hook treats it as a query for `/`.
 *
 * @param rewindId   - The backup's rewind id (decimal-suffix-safe).
 * @param folderPath - Folder to load, or null for the root.
 * @return Children list, loading flag, error.
 */
export function useFileTree( rewindId: string, folderPath: string | null ): Result {
	const path = folderPath ?? BASE_FOLDER_PATH;
	const query = useQuery( {
		queryKey: keys.fileTree( rewindId, path ),
		queryFn: () => fetchFileTree( rewindId, path ),
		enabled: Boolean( rewindId ),
	} );

	const children = useMemo< FileNode[] | null >( () => {
		if ( ! query.data ) {
			return null;
		}
		return ( query.data.contents ?? [] ).map( child => toFileNode( child, path ) );
	}, [ query.data, path ] );

	return {
		children,
		isLoading: query.isLoading,
		error: query.error ?? null,
	};
}
