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
 * Convert a single WPCOM ls entry into the dashboard's `FileNode` shape.
 *
 * WPCOM returns `contents` as a map keyed by filename; the entry value
 * has no `name` of its own, so the key is passed in here as `name`.
 *
 * The `type` field on the entry is ambiguous: at the backup root WPCOM
 * uses `'dir'` / `'file'` / `'wordpress'`, but inside `/wp-content`
 * folders like `"languages"` and `"mu-plugins"` are reported as
 * `type: 'file'` with `has_children: true`. So the real folder/leaf
 * discriminator is `has_children`, not `type`.
 *
 * `period` is a Unix-seconds timestamp the entry was last modified —
 * we surface it as `lastModified` so the FileInfoCard can render the
 * date without a separate path-info call.
 *
 * @param name       - The entry's filename (the key in the parent contents map).
 * @param raw        - The WPCOM ls entry.
 * @param parentPath - Path of the folder the entry lives in.
 * @return The mapped `FileNode`.
 */
function toFileNode( name: string, raw: WpcomFileNode, parentPath: string ): FileNode {
	const fullPath = parentPath === BASE_FOLDER_PATH ? `/${ name }` : `${ parentPath }/${ name }`;

	const isFolder = raw.type === 'dir' || raw.has_children === true;
	if ( isFolder ) {
		return {
			type: 'folder',
			name,
			path: fullPath,
		};
	}

	const lastModified = raw.period
		? new Date( Number.parseInt( raw.period, 10 ) * 1000 ).toISOString()
		: undefined;
	return {
		type: 'file',
		name,
		path: fullPath,
		lastModified,
		period: raw.period,
		manifestPath: raw.manifest_path,
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
		const contents = query.data.contents;
		if ( ! contents || typeof contents !== 'object' ) {
			return [];
		}
		// Skip the virtual `wordpress` core-version markers — they have no
		// children and no manifest_path, so neither tree-render nor preview
		// works on them.
		return Object.entries( contents )
			.filter( ( [ , raw ] ) => raw.type !== 'wordpress' )
			.map( ( [ name, raw ] ) => toFileNode( name, raw, path ) );
	}, [ query.data, path ] );

	return {
		children,
		isLoading: query.isLoading,
		error: query.error ?? null,
	};
}
