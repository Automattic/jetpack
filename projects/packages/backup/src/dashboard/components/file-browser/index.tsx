import { CheckboxControl, Spinner } from '@wordpress/components';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	Icon,
	chevronRight,
	chevronDown,
	file as fileIcon,
	category as folderIcon,
} from '@wordpress/icons';
import { Stack } from '@wordpress/ui';
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
};

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
 * Lazy file-tree browser for the selected backup. Folders fetch their
 * children on first expand via `useMockFileTree`; selecting a file opens
 * `<FileInfoCard>` to the right of the tree with a text preview when the
 * mime type is text-shaped.
 *
 * Selection state lives in the parent (`<BackupDetail>`) so its header
 * buttons can swap between "Download backup" and "Download N selected
 * files" using the same `FileSelection` shape that this tree drives.
 *
 * @param props                   - Component props.
 * @param props.rewindId          - The selected backup's rewindId. Surfaced as a data
 *                                attribute today; the future REST hook will use it.
 * @param props.selection         - Current selection state (selected + deselected sets).
 * @param props.onSelectionChange - Called with the next state when any row toggles.
 * @return The rendered tree.
 */
export default function FileBrowser( { rewindId, selection, onSelectionChange }: Props ) {
	const [ openFilePath, setOpenFilePath ] = useState< string | null >( null );
	const { children: roots } = useMockFileTree( null );
	const { selected, deselected } = selection;

	// Toggle a row given its current effective state. The caller passes
	// `effectiveBefore` so the row can resolve "I see myself as checked"
	// without re-deriving the inherited state here.
	//
	// Effective-checked → unchecked:
	//   - own entry in `selected`: drop it AND prune any descendant
	//     entries from both sets (they no longer have a positive parent
	//     to qualify against).
	//   - otherwise (checked via an ancestor): add this path to
	//     `deselected` as an exception.
	//
	// Effective-unchecked → checked:
	//   - own entry in `deselected`: drop it so the ancestor's positive
	//     state takes over again.
	//   - otherwise: add this path to `selected`.
	const toggleAt = useCallback(
		( path: string, effectiveBefore: boolean ) => {
			const nextSelected = new Set( selected );
			const nextDeselected = new Set( deselected );

			if ( effectiveBefore ) {
				if ( selected.has( path ) ) {
					nextSelected.delete( path );
					const needle = `${ path }/`;
					for ( const s of selected ) {
						if ( s.startsWith( needle ) ) {
							nextSelected.delete( s );
						}
					}
					for ( const d of deselected ) {
						if ( d.startsWith( needle ) ) {
							nextDeselected.delete( d );
						}
					}
				} else {
					nextDeselected.add( path );
				}
			} else if ( deselected.has( path ) ) {
				nextDeselected.delete( path );
			} else {
				nextSelected.add( path );
			}

			onSelectionChange( { selected: nextSelected, deselected: nextDeselected } );
		},
		[ selected, deselected, onSelectionChange ]
	);

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
			selected: new Set( ( roots ?? [] ).map( node => node.path ) ),
			deselected: new Set(),
		} );
	}, [ selected.size, roots, onSelectionChange ] );

	const closeInfoCard = useCallback( () => setOpenFilePath( null ), [] );

	const openFile = roots ? findFileInTree( roots, openFilePath ) : null;

	return (
		<div className="jpb-file-browser" data-rewind-id={ rewindId }>
			<Stack direction="row" align="center" gap="sm" className="jpb-file-browser__selection">
				<CheckboxControl
					checked={ selected.size > 0 }
					label={ sprintf(
						/* translators: %d count of selected files */
						__( '%d files selected', 'jetpack-backup-pkg' ),
						selected.size
					) }
					onChange={ toggleSelectAll }
					__nextHasNoMarginBottom
				/>
			</Stack>
			<div className="jpb-file-browser__layout">
				<div className="jpb-file-browser__tree">
					{ ( roots ?? [] ).map( ( node, index ) => (
						<NodeRow
							key={ node.path }
							node={ node }
							depth={ 0 }
							isAlternate={ index % 2 === 1 }
							ancestorSelected={ false }
							selection={ selection }
							onToggle={ toggleAt }
							onOpenFile={ setOpenFilePath }
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
};

/**
 * Recursive row inside the file-browser tree. Folders own their own
 * expand state; while a folder is open, `useMockFileTree` keeps its
 * children resolved (re-collapsing and re-opening re-issues the fetch).
 *
 * Two pieces of state propagate top-down:
 *
 *   - `ancestorSelected`: the *effective* checked state of this row's
 *     nearest ancestor. The row resolves its own effective state with
 *     "own selected beats own deselected beats ancestor" and passes the
 *     result down to its children.
 *   - Zebra parity (`isAlternate`): toggled before each child so the
 *     stripe runs continuously through nested branches.
 *
 * A folder renders the indeterminate "—" dash when it's effectively
 * checked AND any descendant path lives in `selection.deselected`.
 *
 * @param props                  - Component props.
 * @param props.node             - The node to render.
 * @param props.depth            - Indent depth (root = 0).
 * @param props.isAlternate      - Whether this row gets the alt (gray) background.
 * @param props.ancestorSelected - True when this row inherits a checked state from
 *                               a selected ancestor (modulo its own deselection).
 * @param props.selection        - Current selection state (selected + deselected sets).
 * @param props.onToggle         - Called with the row's path and current effective
 *                               state when the checkbox toggles.
 * @param props.onOpenFile       - Open the info-card for a file path.
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
}: NodeRowProps ) {
	const [ open, setOpen ] = useState( false );
	const nodeIsFolder = isFolder( node );
	const { children, isLoading } = useMockFileTree( open && nodeIsFolder ? node.path : null );
	const { selected, deselected } = selection;

	// Effective check: own positive > own negative > inherited positive.
	const ownSelected = selected.has( node.path );
	const ownDeselected = deselected.has( node.path );
	const isEffectivelySelected = ownSelected || ( ! ownDeselected && ancestorSelected );

	// Indeterminate when effectively checked AND some descendant has an
	// exception entry. Memoized because `hasDescendant` is O(deselected),
	// and the deselected set can change without flipping the parents'
	// own state.
	const isIndeterminate = useMemo(
		() =>
			isEffectivelySelected &&
			nodeIsFolder &&
			hasDescendant( deselected, node.path ),
		[ isEffectivelySelected, nodeIsFolder, deselected, node.path ]
	);

	const handleToggleSelected = useCallback(
		() => onToggle( node.path, isEffectivelySelected ),
		[ onToggle, node.path, isEffectivelySelected ]
	);
	const handleToggleOpen = useCallback( () => setOpen( v => ! v ), [] );
	const handleOpenFile = useCallback( () => onOpenFile( node.path ), [ onOpenFile, node.path ] );

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
							{ __( 'Empty', 'jetpack-backup-pkg' ) }
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
