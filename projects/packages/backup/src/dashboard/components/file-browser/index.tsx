import { CheckboxControl, Spinner } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	Icon,
	chevronRight,
	chevronDown,
	file as fileIcon,
	category as folderIcon,
} from '@wordpress/icons';
import { Stack, Text } from '@wordpress/ui';
import { useMockFileTree } from '../../hooks/use-mock-file-tree';
import { isFolder } from '../../types/file-tree';
import FileInfoCard from '../file-info-card';
import './style.scss';
import type { FileNode, FileNodeFile } from '../../types/file-tree';

type Props = {
	rewindId: string;
};

/**
 * Lazy file-tree browser for the selected backup. Folders fetch their
 * children on first expand via `useMockFileTree`; selecting a file opens
 * `<FileInfoCard>` to the right of the tree with a text preview when the
 * mime type is text-shaped.
 *
 * @param props          - Component props.
 * @param props.rewindId - The selected backup's rewindId. Surfaced as a data
 *                       attribute today; the future REST hook will use it to
 *                       scope its requests to a specific backup point.
 * @return The rendered tree.
 */
export default function FileBrowser( { rewindId }: Props ) {
	const [ selected, setSelected ] = useState< Set< string > >( () => new Set() );
	const [ openFilePath, setOpenFilePath ] = useState< string | null >( null );
	const { children: roots } = useMockFileTree( null );

	const toggleSelected = useCallback( ( path: string ) => {
		setSelected( prev => {
			const next = new Set( prev );
			if ( next.has( path ) ) {
				next.delete( path );
			} else {
				next.add( path );
			}
			return next;
		} );
	}, [] );

	const clearSelected = useCallback( () => setSelected( new Set() ), [] );
	const closeInfoCard = useCallback( () => setOpenFilePath( null ), [] );

	const openFile = roots ? findFileInTree( roots, openFilePath ) : null;

	return (
		<div className="jpb-file-browser" data-rewind-id={ rewindId }>
			<Stack direction="row" align="center" gap="sm" className="jpb-file-browser__header">
				<Text weight="600">{ __( 'FILES', 'jetpack-backup-pkg' ) }</Text>
			</Stack>
			<Stack direction="row" align="center" gap="sm" className="jpb-file-browser__selection">
				<CheckboxControl
					checked={ selected.size > 0 }
					label={ sprintf(
						/* translators: %d count of selected files */
						__( '%d files selected', 'jetpack-backup-pkg' ),
						selected.size
					) }
					onChange={ clearSelected }
					__nextHasNoMarginBottom
				/>
			</Stack>
			<div className="jpb-file-browser__layout">
				<div className="jpb-file-browser__tree">
					{ ( roots ?? [] ).map( node => (
						<NodeRow
							key={ node.path }
							node={ node }
							depth={ 0 }
							selected={ selected }
							onToggleSelected={ toggleSelected }
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
	selected: Set< string >;
	onToggleSelected: ( path: string ) => void;
	onOpenFile: ( path: string ) => void;
};

/**
 * Recursive row inside the file-browser tree. Folders own their own
 * expand state; while a folder is open, `useMockFileTree` keeps its
 * children resolved (re-collapsing and re-opening re-issues the fetch).
 *
 * @param props                  - Component props.
 * @param props.node             - The node to render.
 * @param props.depth            - Indent depth (root = 0).
 * @param props.selected         - Set of selected paths shared across rows.
 * @param props.onToggleSelected - Toggle selection for a path.
 * @param props.onOpenFile       - Open the info-card for a file path.
 * @return The rendered row.
 */
function NodeRow( { node, depth, selected, onToggleSelected, onOpenFile }: NodeRowProps ) {
	const [ open, setOpen ] = useState( false );
	const nodeIsFolder = isFolder( node );
	const { children, isLoading } = useMockFileTree( open && nodeIsFolder ? node.path : null );

	const handleToggleSelected = useCallback(
		() => onToggleSelected( node.path ),
		[ onToggleSelected, node.path ]
	);
	const handleToggleOpen = useCallback( () => setOpen( v => ! v ), [] );
	const handleOpenFile = useCallback( () => onOpenFile( node.path ), [ onOpenFile, node.path ] );

	return (
		<div>
			<div className="jpb-file-browser__row" style={ { paddingLeft: 12 + depth * 16 } }>
				<CheckboxControl
					checked={ selected.has( node.path ) }
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
						( children ?? [] ).map( child => (
							<NodeRow
								key={ child.path }
								node={ child }
								depth={ depth + 1 }
								selected={ selected }
								onToggleSelected={ onToggleSelected }
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
