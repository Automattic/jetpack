import { useEffect, useState } from '@wordpress/element';
import { findNodeByPath } from '../fixtures/file-tree';
import { isFolder } from '../types/file-tree';
import type { FileNode } from '../types/file-tree';

const FOLDER_LOAD_MS = 300;

type Result = {
	children: FileNode[] | null;
	isLoading: boolean;
};

/**
 * Hook returning the lazily-loaded children of a folder in the mock
 * file tree. Passing a folder path resolves the children after a 300ms
 * synthetic delay so the tree exercises its per-folder loading state;
 * passing `null` no-ops (keeps the previously-loaded children cached
 * so a caller that just collapsed a folder doesn't lose them).
 *
 * Callers that need the top-level roots should import `MOCK_FILE_TREE`
 * directly — this hook only handles non-root lazy loads so a row that
 * passes `null` (e.g. a collapsed folder) doesn't accidentally see the
 * root tree as its own children.
 *
 * @param folderPath - Folder path to load, or null to leave state alone.
 * @return Loaded children + loading flag.
 */
export function useMockFileTree( folderPath: string | null ): Result {
	const [ isLoading, setIsLoading ] = useState( false );
	const [ children, setChildren ] = useState< FileNode[] | null >( null );

	useEffect( () => {
		if ( folderPath === null ) {
			setIsLoading( false );
			return;
		}
		setIsLoading( true );
		const handle = window.setTimeout( () => {
			const node = findNodeByPath( folderPath );
			setChildren( node && isFolder( node ) ? node.children ?? [] : [] );
			setIsLoading( false );
		}, FOLDER_LOAD_MS );
		return () => window.clearTimeout( handle );
	}, [ folderPath ] );

	return { children, isLoading };
}
