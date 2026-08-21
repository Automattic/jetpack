import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from '@wordpress/element';
import { fetchFileTree, type WpcomFileNode } from '../data/api/file-tree';
import { keys } from '../data/query-client';
import { useStickyError } from './use-sticky-error';
import type { FileNode } from '../types/file-tree';

const BASE_FOLDER_PATH = '/';

type Result = {
	children: FileNode[] | null;
	isLoading: boolean;
	/**
	 * True while a refetch is in flight. Distinct from `isLoading`: a
	 * query in the error state is never pending, so `isLoading` stays
	 * false for the whole duration of a retry.
	 */
	isFetching: boolean;
	error: Error | null;
	refetch: () => void;
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
 * Exported for tests: it's a pure transform of one untrusted WPCOM entry,
 * and the timestamp guard below is worth asserting directly.
 *
 * @param name       - The entry's filename (the key in the parent contents map).
 * @param raw        - The WPCOM ls entry.
 * @param parentPath - Path of the folder the entry lives in.
 * @return The mapped `FileNode`.
 */
export function toFileNode( name: string, raw: WpcomFileNode, parentPath: string ): FileNode {
	const fullPath = parentPath === BASE_FOLDER_PATH ? `/${ name }` : `${ parentPath }/${ name }`;

	const isFolder = raw.type === 'dir' || raw.has_children === true;
	if ( isFolder ) {
		return {
			type: 'folder',
			name,
			path: fullPath,
		};
	}

	// `period` is unix seconds as a string, but it comes straight from a
	// WPCOM manifest and nothing validates it. `toISOString()` throws
	// `RangeError: Invalid time value` on an unrepresentable date, and one
	// malformed entry would take the whole file browser down with it —
	// this runs inside a `useMemo` on the render path, so the route-level
	// error boundary would catch it, but as a blanked screen rather than a
	// single dropped timestamp.
	//
	// Testing the resulting `Date` rather than the parsed number is what
	// makes this complete: `Number.isFinite` alone rejects non-numeric
	// values but happily passes anything inside float range, and `Date` is
	// only defined within ±8.64e15 ms. A `period` in microseconds — one
	// kind of upstream drift for an unvalidated field — is finite and
	// still unrepresentable. Note a *millisecond*-scale value is not: it
	// stays in range and renders a far-future date, which nothing here
	// can distinguish from a genuine one.
	const periodSeconds = raw.period ? Number.parseInt( raw.period, 10 ) : NaN;
	const lastModifiedDate = new Date( periodSeconds * 1000 );
	const lastModified = Number.isNaN( lastModifiedDate.getTime() )
		? undefined
		: lastModifiedDate.toISOString();
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
 * @return Children list, loading flag, error, refetch.
 */
export function useFileTree( rewindId: string, folderPath: string | null ): Result {
	const path = folderPath ?? BASE_FOLDER_PATH;
	const query = useQuery( {
		queryKey: keys.fileTree( rewindId, path ),
		queryFn: () => fetchFileTree( rewindId, path ),
		enabled: Boolean( rewindId ),
	} );
	const { refetch } = query;

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

	// Wrapped so callers can hand it straight to `onClick` without
	// returning a floating promise from the event handler.
	const retry = useCallback( () => {
		refetch();
	}, [ refetch ] );

	// Held across the retry: React Query rewinds this query to `pending`
	// when it refetches after a failure, so without this the reason
	// disappears the moment the reader clicks the retry button.
	const error = useStickyError( query.error, query.isFetching );

	return {
		children,
		isLoading: query.isLoading,
		isFetching: query.isFetching,
		error,
		refetch: retry,
	};
}
