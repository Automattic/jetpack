import { useEffect, useState } from '@wordpress/element';
import { findNodeByPath, MOCK_FILE_TREE } from '../fixtures/file-tree';
import { isFolder } from '../types/file-tree';
import type { FileNode } from '../types/file-tree';

const FOLDER_LOAD_MS = 300;

type Result = {
	children: FileNode[] | null;
	isLoading: boolean;
};

/**
 * Hook returning the children of a folder in the mock file tree.
 *
 * Passing `null` returns the root nodes synchronously (no latency); passing
 * a folder path resolves the children after a 300ms synthetic delay so the
 * tree exercises its per-folder loading state. Identical signature to what
 * the future REST-driven hook will expose.
 *
 * @param folderPath - Folder path to load, or null for the root.
 * @return Loaded children + loading flag.
 */
export function useMockFileTree( folderPath: string | null ): Result {
	// Seed state synchronously when asked for the root so the tree paints
	// fully on first render. Non-root paths still flip through isLoading.
	const [ isLoading, setIsLoading ] = useState( false );
	const [ children, setChildren ] = useState< FileNode[] | null >(
		folderPath === null ? MOCK_FILE_TREE : null
	);

	useEffect( () => {
		if ( folderPath === null ) {
			setChildren( MOCK_FILE_TREE );
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
