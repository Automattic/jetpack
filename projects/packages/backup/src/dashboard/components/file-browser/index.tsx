import { CheckboxControl, Spinner } from '@wordpress/components';
import { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import {
	Icon,
	chevronRight,
	chevronDown,
	file as fileIcon,
	category as folderIcon,
} from '@wordpress/icons';
import { Stack } from '@wordpress/ui';
import { MOCK_FILE_TREE } from '../../fixtures/file-tree';
import { useMockFileTree } from '../../hooks/use-mock-file-tree';
import { isFolder } from '../../types/file-tree';
import FileInfoCard from '../file-info-card';
import './style.scss';
import type { FileNode, FileNodeFile } from '../../types/file-tree';

/**
 * Tree-checkbox selection state.
 *
 * `selected` holds paths the visitor explicitly checked; `deselected`
 * holds the exception paths they unchecked while inside a selected
 * ancestor's subtree. A path is "effectively selected" when its closest
 * own-set entry (or, falling back, an ancestor's `selected` entry) is
 * positive — `selected` beats `deselected` at the same row, and a row's
 * own entry beats any ancestor.
 */
export type FileSelection = {
	selected: ReadonlySet< string >;
	deselected: ReadonlySet< string >;
};

export const EMPTY_FILE_SELECTION: FileSelection = {
	selected: new Set(),
	deselected: new Set(),
};

type Props = {
	rewindId: string;
	selection: FileSelection;
	onSelectionChange: ( next: FileSelection ) => void;
	onSelectionCountChange?: ( count: number ) => void;
};

/**
 * Parent path for a tree path. Returns `''` for top-level paths (their
 * parent is the conceptual root) and `null` for the root itself.
 *
 * @param path - Absolute path under the backup (e.g. `'/wp-content/themes'`).
 * @return Parent path, `''` for top-level, or `null` for the root.
 */
function parentOf( path: string ): string | null {
	if ( path === '' ) {
		return null;
	}
	const idx = path.lastIndexOf( '/' );
	return idx <= 0 ? '' : path.slice( 0, idx );
}

/**
 * Resolves whether `path` is effectively selected given the current
 * selection sets, by walking up the path until we hit an own entry.
 *
 * @param path     - Path to resolve.
 * @param selected - Current `selected` set.
 * @param deselect - Current `deselected` set.
 * @return True when the path resolves to selected.
 */
function isPathSelected(
	path: string,
	selected: ReadonlySet< string >,
	deselect: ReadonlySet< string >
): boolean {
	let current: string | null = path;
	while ( current && current !== '' ) {
		if ( selected.has( current ) ) {
			return true;
		}
		if ( deselect.has( current ) ) {
			return false;
		}
		current = parentOf( current );
	}
	return false;
}

/**
 * Returns true when any path in `paths` is a descendant of `prefix`.
 *
 * @param paths  - Set of paths to scan.
 * @param prefix - Ancestor path (without trailing slash).
 * @return True when at least one path starts with `prefix + "/"`.
 */
function hasDescendant( paths: ReadonlySet< string >, prefix: string ): boolean {
	const needle = `${ prefix }/`;
	for ( const p of paths ) {
		if ( p.startsWith( needle ) ) {
			return true;
		}
	}
	return false;
}

/**
 * Removes every entry in `set` that's a strict descendant of `prefix`.
 * Mutates `set` in place.
 *
 * @param set    - Set to prune.
 * @param prefix - Ancestor path (without trailing slash).
 */
function pruneDescendants( set: Set< string >, prefix: string ): void {
	const needle = `${ prefix }/`;
	for ( const p of [ ...set ] ) {
		if ( p.startsWith( needle ) ) {
			set.delete( p );
		}
	}
}

/**
 * Marks `path` as effectively deselected by either dropping its own
 * positive entry (and pruning its now-orphaned subtree exceptions) or
 * recording a negative exception against an inherited ancestor. Mutates
 * the provided sets.
 *
 * @param path           - Path to deselect.
 * @param nextSelected   - Mutable working `selected` set.
 * @param nextDeselected - Mutable working `deselected` set.
 */
function applyDeselect(
	path: string,
	nextSelected: Set< string >,
	nextDeselected: Set< string >
): void {
	if ( nextSelected.has( path ) ) {
		nextSelected.delete( path );
		pruneDescendants( nextSelected, path );
		pruneDescendants( nextDeselected, path );
	} else {
		nextDeselected.add( path );
	}
}

/**
 * Marks `path` as effectively selected. Clears any own negative entry
 * and — only if removing that exception wouldn't already leave the row
 * inherited-selected from an ancestor — adds an own positive entry.
 * Descendant entries collapse into the inherited state. Mutates the
 * provided sets.
 *
 * The ancestor check matters when an ancestor is itself in
 * `deselected`: dropping our own exception alone would leave the row
 * inherited-deselected, so the visitor's click wouldn't actually
 * re-check it.
 *
 * @param path           - Path to select.
 * @param nextSelected   - Mutable working `selected` set.
 * @param nextDeselected - Mutable working `deselected` set.
 */
function applySelect(
	path: string,
	nextSelected: Set< string >,
	nextDeselected: Set< string >
): void {
	nextDeselected.delete( path );
	if ( ! isPathSelected( path, nextSelected, nextDeselected ) ) {
		nextSelected.add( path );
	}
	// Any descendant exception or now-redundant positive collapses into
	// the inherited state from this row.
	pruneDescendants( nextSelected, path );
	pruneDescendants( nextDeselected, path );
}

/**
 * Walks up from `path` and deselects ancestors whose loaded children
 * are now all effectively deselected. Stops at the first ancestor that
 * still has a selected child, an ancestor whose children we haven't
 * loaded, or the conceptual root. Mutates the provided sets.
 *
 * @param path           - Path that just became deselected.
 * @param nextSelected   - Mutable working `selected` set.
 * @param nextDeselected - Mutable working `deselected` set.
 * @param loadedChildren - Map of folder path → loaded children list; top-level roots live under the empty-string key.
 */
function propagateDeselectUp(
	path: string,
	nextSelected: Set< string >,
	nextDeselected: Set< string >,
	loadedChildren: ReadonlyMap< string, FileNode[] >
): void {
	let current: string | null = path;
	while ( current !== null ) {
		const parent = parentOf( current );
		if ( parent === null || parent === '' ) {
			return;
		}
		if ( ! isPathSelected( parent, nextSelected, nextDeselected ) ) {
			return;
		}
		const siblings = loadedChildren.get( parent );
		if ( ! siblings ) {
			return;
		}
		const allDeselected = siblings.every(
			sibling => ! isPathSelected( sibling.path, nextSelected, nextDeselected )
		);
		if ( ! allDeselected ) {
			return;
		}
		applyDeselect( parent, nextSelected, nextDeselected );
		current = parent;
	}
}

/**
 * Symmetric to `propagateDeselectUp`: walks up from `path` and
 * re-selects ancestors whose loaded children are now all effectively
 * selected. Stops at the first ancestor that's already effectively
 * selected, has an unselected loaded child, has no loaded children, or
 * is the conceptual root. Mutates the provided sets.
 *
 * @param path           - Path that just became selected.
 * @param nextSelected   - Mutable working `selected` set.
 * @param nextDeselected - Mutable working `deselected` set.
 * @param loadedChildren - Map of folder path → loaded children list.
 */
function propagateSelectUp(
	path: string,
	nextSelected: Set< string >,
	nextDeselected: Set< string >,
	loadedChildren: ReadonlyMap< string, FileNode[] >
): void {
	let current: string | null = path;
	while ( current !== null ) {
		const parent = parentOf( current );
		if ( parent === null || parent === '' ) {
			return;
		}
		if ( isPathSelected( parent, nextSelected, nextDeselected ) ) {
			return;
		}
		const siblings = loadedChildren.get( parent );
		if ( ! siblings ) {
			return;
		}
		const allSelected = siblings.every( sibling =>
			isPathSelected( sibling.path, nextSelected, nextDeselected )
		);
		if ( ! allSelected ) {
			return;
		}
		applySelect( parent, nextSelected, nextDeselected );
		current = parent;
	}
}

/**
 * Counts effectively-selected leaves in the loaded subtree of `roots`.
 *
 * A "leaf" here is what the server would download as one opaque unit:
 * a file, or a folder whose children we haven't loaded yet (whatever
 * it contains is bundled into that single selection). Folders we've
 * already expanded contribute their leaves instead of themselves, and
 * indeterminate folders contribute only the effectively-selected
 * descendants underneath them — neither the partial folder nor the
 * deselected branches count.
 *
 * @param roots          - Top-level nodes to start from.
 * @param selection      - Current selection sets.
 * @param loadedChildren - Map of folder path → loaded children list.
 * @return Count of effectively-selected leaves.
 */
function countSelectedInLoadedTree(
	roots: FileNode[],
	selection: FileSelection,
	loadedChildren: ReadonlyMap< string, FileNode[] >
): number {
	const { selected, deselected } = selection;
	let count = 0;
	const walk = ( nodes: FileNode[], inheritedSelected: boolean ) => {
		for ( const node of nodes ) {
			const ownSelected = selected.has( node.path );
			const ownDeselected = deselected.has( node.path );
			const eff = ownSelected || ( ! ownDeselected && inheritedSelected );
			const loadedKids = isFolder( node ) ? loadedChildren.get( node.path ) : undefined;
			if ( loadedKids ) {
				// Folder with known contents — its leaves count, not itself.
				walk( loadedKids, eff );
			} else if ( eff ) {
				// File, or a folder whose contents we haven't loaded:
				// the server treats either as a single downloadable unit.
				count += 1;
			}
		}
	};
	walk( roots, false );
	return count;
}

/**
 * Lazy file-tree browser for the selected backup. Folders fetch their
 * children on first expand via `useMockFileTree`; selecting a file opens
 * `<FileInfoCard>` to the right of the tree with a text preview when the
 * mime type is text-shaped.
 *
 * Selection state lives in the parent (`<BackupDetail>`) so its header
 * buttons can swap between "Download backup" and "Download N selected
 * files" using the same `FileSelection` shape that this tree drives.
 *
 * @param props                        - Component props.
 * @param props.rewindId               - The selected backup's rewindId; surfaced as a data attribute today, the future REST hook will use it.
 * @param props.selection              - Current selection state (selected + deselected sets).
 * @param props.onSelectionChange      - Called with the next state when any row toggles.
 * @param props.onSelectionCountChange - Called whenever the visible-selected leaf count changes.
 * @return The rendered tree.
 */
export default function FileBrowser( {
	rewindId,
	selection,
	onSelectionChange,
	onSelectionCountChange,
}: Props ) {
	const [ openFilePath, setOpenFilePath ] = useState< string | null >( null );
	const roots = MOCK_FILE_TREE;
	const { selected, deselected } = selection;

	// Loaded folder children, hoisted here so toggle propagation and the
	// effective-selected count can reason about siblings the visitor has
	// already expanded. Top-level roots live under the empty-string key
	// so `parentOf('/foo') === ''` resolves consistently.
	const [ loadedChildren, setLoadedChildren ] = useState< Map< string, FileNode[] > >(
		() => new Map< string, FileNode[] >( [ [ '', roots ] ] )
	);

	const registerChildren = useCallback( ( path: string, children: FileNode[] ) => {
		setLoadedChildren( prev => {
			if ( prev.get( path ) === children ) {
				return prev;
			}
			const next = new Map( prev );
			next.set( path, children );
			return next;
		} );
	}, [] );

	// Toggle a row given its current effective state. The caller passes
	// `effectiveBefore` so the row can resolve "I see myself as checked"
	// without re-deriving the inherited state here.
	//
	// In both directions we apply the leaf change first, then walk up:
	// each ancestor whose loaded children have all collapsed to the new
	// state gets pulled along with it. The walk stops at the first
	// ancestor whose children we haven't loaded (we can't tell whether
	// unseen descendants would still hold the other state), the first
	// ancestor that's already in the desired state, or the conceptual
	// root.
	const toggleAt = useCallback(
		( path: string, effectiveBefore: boolean ) => {
			const nextSelected = new Set( selected );
			const nextDeselected = new Set( deselected );

			if ( effectiveBefore ) {
				applyDeselect( path, nextSelected, nextDeselected );
				propagateDeselectUp( path, nextSelected, nextDeselected, loadedChildren );
			} else {
				applySelect( path, nextSelected, nextDeselected );
				propagateSelectUp( path, nextSelected, nextDeselected, loadedChildren );
			}

			onSelectionChange( { selected: nextSelected, deselected: nextDeselected } );
		},
		[ selected, deselected, loadedChildren, onSelectionChange ]
	);

	const selectedCount = useMemo(
		() => countSelectedInLoadedTree( roots, selection, loadedChildren ),
		[ roots, selection, loadedChildren ]
	);

	useEffect( () => {
		onSelectionCountChange?.( selectedCount );
	}, [ selectedCount, onSelectionCountChange ] );

	// The selection summary's checkbox doubles as a "select all / clear"
	// toggle: clicking it with anything selected clears both sets,
	// clicking with nothing selected seeds every top-level root path as
	// a positive selection. Mirrors the legacy backup-contents header
	// — selecting a folder includes its whole subtree on the server side,
	// so we don't need to recurse the lazy-loaded child paths here.
	const toggleSelectAll = useCallback( () => {
		if ( selected.size > 0 ) {
			onSelectionChange( EMPTY_FILE_SELECTION );
			return;
		}
		onSelectionChange( {
			selected: new Set( roots.map( node => node.path ) ),
			deselected: new Set(),
		} );
	}, [ selected.size, roots, onSelectionChange ] );

	const closeInfoCard = useCallback( () => setOpenFilePath( null ), [] );

	const openFile = findFileInTree( roots, openFilePath );

	return (
		<div className="jpb-file-browser" data-rewind-id={ rewindId }>
			<Stack direction="row" align="center" gap="sm" className="jpb-file-browser__selection">
				<CheckboxControl
					checked={ selected.size > 0 }
					label={ sprintf(
						/* translators: %d count of selected items (files + opaque folders) */
						_n( '%d item selected', '%d items selected', selectedCount, 'jetpack-backup-pkg' ),
						selectedCount
					) }
					onChange={ toggleSelectAll }
					__nextHasNoMarginBottom
				/>
			</Stack>
			<div className="jpb-file-browser__layout">
				<div className="jpb-file-browser__tree">
					{ roots.map( ( node, index ) => (
						<NodeRow
							key={ node.path }
							node={ node }
							depth={ 0 }
							isAlternate={ index % 2 === 1 }
							ancestorSelected={ false }
							selection={ selection }
							onToggle={ toggleAt }
							onOpenFile={ setOpenFilePath }
							onRegisterChildren={ registerChildren }
						/>
					) ) }
				</div>
				{ openFile && <FileInfoCard file={ openFile } onClose={ closeInfoCard } /> }
			</div>
		</div>
	);
}

type NodeRowProps = {
	node: FileNode;
	depth: number;
	isAlternate: boolean;
	ancestorSelected: boolean;
	selection: FileSelection;
	onToggle: ( path: string, effectiveBefore: boolean ) => void;
	onOpenFile: ( path: string ) => void;
	onRegisterChildren: ( path: string, children: FileNode[] ) => void;
};

/**
 * Recursive row inside the file-browser tree. Folders own their own expand state; while a folder is open, `useMockFileTree` keeps its children resolved (re-collapsing and re-opening re-issues the fetch).
 *
 * Two pieces of state propagate top-down: `ancestorSelected` carries the *effective* checked state of the nearest ancestor (own selected beats own deselected beats ancestor), and zebra parity (`isAlternate`) is toggled before each child so the stripe runs continuously through nested branches.
 *
 * A folder renders the indeterminate "—" dash when (a) it's effectively checked and any descendant path lives in `selection.deselected`, or (b) it's effectively unchecked and any descendant lives in `selection.selected`.
 *
 * @param props                    - Component props.
 * @param props.node               - The node to render.
 * @param props.depth              - Indent depth (root = 0).
 * @param props.isAlternate        - Whether this row gets the alt (gray) background.
 * @param props.ancestorSelected   - True when this row inherits a checked state from a selected ancestor (modulo its own deselection).
 * @param props.selection          - Current selection state (selected + deselected sets).
 * @param props.onToggle           - Called with the row's path and current effective state when the checkbox toggles.
 * @param props.onOpenFile         - Open the info-card for a file path.
 * @param props.onRegisterChildren - Reports loaded child lists up so the parent can reason about siblings during toggle propagation and the visible-selected count.
 * @return The rendered row.
 */
function NodeRow( {
	node,
	depth,
	isAlternate,
	ancestorSelected,
	selection,
	onToggle,
	onOpenFile,
	onRegisterChildren,
}: NodeRowProps ) {
	const [ open, setOpen ] = useState( false );
	const nodeIsFolder = isFolder( node );
	const { children, isLoading } = useMockFileTree( open && nodeIsFolder ? node.path : null );
	const { selected, deselected } = selection;

	// Effective check: own positive > own negative > inherited positive.
	const ownSelected = selected.has( node.path );
	const ownDeselected = deselected.has( node.path );
	const isEffectivelySelected = ownSelected || ( ! ownDeselected && ancestorSelected );

	// Indeterminate is symmetric:
	//   - effectively checked + a deselected descendant (partial-out)
	//   - effectively unchecked + a selected descendant (partial-in,
	//     e.g. the visitor selected a leaf without its ancestor folders)
	// Memoized because `hasDescendant` is O(set) and the relevant set
	// can change without flipping this row's own state.
	const isIndeterminate = useMemo( () => {
		if ( ! nodeIsFolder ) {
			return false;
		}
		const exceptions = isEffectivelySelected ? deselected : selected;
		return hasDescendant( exceptions, node.path );
	}, [ isEffectivelySelected, nodeIsFolder, selected, deselected, node.path ] );

	const handleToggleSelected = useCallback(
		() => onToggle( node.path, isEffectivelySelected ),
		[ onToggle, node.path, isEffectivelySelected ]
	);
	const handleToggleOpen = useCallback( () => setOpen( v => ! v ), [] );
	const handleOpenFile = useCallback( () => onOpenFile( node.path ), [ onOpenFile, node.path ] );

	// Register the loaded children with the FileBrowser parent once
	// they've actually resolved for this folder. The gate skips the
	// in-flight window between "open clicked" and "fetch resolved"
	// where `children` still holds whatever the previous render had.
	const childrenStableRef = useRef< FileNode[] | null >( null );
	useEffect( () => {
		if ( ! open || ! nodeIsFolder || isLoading || ! children ) {
			return;
		}
		if ( childrenStableRef.current === children ) {
			return;
		}
		childrenStableRef.current = children;
		onRegisterChildren( node.path, children );
	}, [ open, nodeIsFolder, isLoading, children, node.path, onRegisterChildren ] );

	const rowClassName = isAlternate
		? 'jpb-file-browser__row jpb-file-browser__row--alt'
		: 'jpb-file-browser__row';

	return (
		<div>
			<div className={ rowClassName } style={ { paddingLeft: 12 + depth * 16 } }>
				<CheckboxControl
					checked={ isEffectivelySelected }
					indeterminate={ isIndeterminate }
					onChange={ handleToggleSelected }
					label=""
					__nextHasNoMarginBottom
				/>
				{ nodeIsFolder ? (
					<button type="button" className="jpb-file-browser__toggle" onClick={ handleToggleOpen }>
						<Icon icon={ open ? chevronDown : chevronRight } size={ 16 } />
						<Icon icon={ folderIcon } size={ 18 } />
						<span>{ node.name }</span>
					</button>
				) : (
					<button type="button" className="jpb-file-browser__file" onClick={ handleOpenFile }>
						<Icon icon={ fileIcon } size={ 18 } />
						<span>{ node.name }</span>
					</button>
				) }
			</div>
			{ open && nodeIsFolder && (
				<div className="jpb-file-browser__children">
					{ isLoading && (
						<div className="jpb-file-browser__loading" style={ { paddingLeft: 28 + depth * 16 } }>
							<Spinner />
						</div>
					) }
					{ ! isLoading && ( children ?? [] ).length === 0 && (
						<div className="jpb-file-browser__empty" style={ { paddingLeft: 44 + depth * 16 } }>
							{
								/* translators: shown inside an expanded folder in the backup file browser when the folder contains no files. */
								__( 'Empty', 'jetpack-backup-pkg' )
							}
						</div>
					) }
					{ ! isLoading &&
						( children ?? [] ).map( ( child, index ) => (
							<NodeRow
								key={ child.path }
								node={ child }
								depth={ depth + 1 }
								// Toggle before each child so the first one inverts the
								// parent's parity, then alternates from there.
								isAlternate={ index % 2 === 0 ? ! isAlternate : isAlternate }
								ancestorSelected={ isEffectivelySelected }
								selection={ selection }
								onToggle={ onToggle }
								onOpenFile={ onOpenFile }
								onRegisterChildren={ onRegisterChildren }
							/>
						) ) }
				</div>
			) }
		</div>
	);
}

/**
 * Recursively searches the rendered tree for a file at the given path.
 *
 * @param nodes - Nodes to search.
 * @param path  - File path to match, or null to short-circuit.
 * @return The matching file node, or null.
 */
function findFileInTree( nodes: FileNode[], path: string | null ): FileNodeFile | null {
	if ( ! path ) {
		return null;
	}
	for ( const node of nodes ) {
		if ( node.path === path && ! isFolder( node ) ) {
			return node;
		}
		if ( isFolder( node ) && node.children ) {
			const found = findFileInTree( node.children, path );
			if ( found ) {
				return found;
			}
		}
	}
	return null;
}
