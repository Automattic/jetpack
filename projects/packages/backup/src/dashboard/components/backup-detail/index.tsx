import { dateI18n } from '@wordpress/date';
import { createInterpolateElement, useCallback, useMemo, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Icon, cloud, download as downloadIcon, rotateLeft } from '@wordpress/icons';
import { Link } from '@wordpress/route';
import { Card, Stack, Text } from '@wordpress/ui';
import FileBrowser, { EMPTY_FILE_SELECTION } from '../file-browser';
import './style.scss';
import type { BackupActivityItem } from '../../types/activity';
import type { FileSelection } from '../file-browser';

type Props = {
	item: BackupActivityItem;
};

/**
 * Returns the appropriate "Download" header-label given how many items
 * the visitor has selected in the file browser. With zero we default to
 * the whole-backup download.
 *
 * The count is of *nameable* items — the entries the link can actually
 * carry — not of ticked rows. The two differ only when upstream gave an
 * entry no id, and in that case the whole-backup label is the true one.
 *
 * @param count - Number of selected items the download request can name.
 * @return Localized button label.
 */
function downloadLabel( count: number ): string {
	if ( count === 0 ) {
		return __( 'Download backup', 'jetpack-backup-pkg' );
	}
	return sprintf(
		/* translators: %d count of selected items (files + opaque folders) */
		_n( 'Download %d selected item', 'Download %d selected items', count, 'jetpack-backup-pkg' ),
		count
	);
}

/**
 * Right-pane detail card for a selected backup activity item.
 *
 * Shows the item's title header with Download / Restore actions linking to the
 * matching sibling routes, the backup's summary line, a timestamp by-line,
 * and the file browser. File selection state lives here so the Download
 * action can switch between "Download backup" and "Download %d selected
 * item" based on what the visitor has checked in the tree, and so its
 * link can carry that selection to the Download screen. Restore does
 * neither — see its call site.
 *
 * @param props      - Component props.
 * @param props.item - The selected backup activity item.
 * @return The rendered detail card.
 */
export default function BackupDetail( { item }: Props ) {
	const [ selection, setSelection ] = useState< FileSelection >( EMPTY_FILE_SELECTION );
	// Download only; Restore beside it is deliberately untouched by the selection.
	// One id per server-side download unit: files, plus unloaded folders standing
	// for their subtrees. Label and link are both built from this one list — the
	// tree can hold a selected entry upstream gave no `id`, so counting the tree
	// would promise a scoped download over a link carrying nothing.
	const [ selectedIds, setSelectedIds ] = useState< string[] >( [] );

	// FileBrowser rebuilds the array on every recompute, so a plain
	// setter would re-render this subtree on selections that changed
	// nothing. Returning `prev` unchanged lets React bail out instead.
	const handleSelectionIdsChange = useCallback( ( next: string[] ) => {
		setSelectedIds( prev =>
			prev.length === next.length && prev.every( ( id, index ) => id === next[ index ] )
				? prev
				: next
		);
	}, [] );

	// One comma-joined string rather than repeated params: the comma is
	// upstream's own separator between `ls` entries, so an id may already
	// carry one. Absent when nothing is ticked, so a whole-backup download
	// links exactly as it did before.
	const downloadSearch = useMemo(
		() => ( selectedIds.length > 0 ? { files: selectedIds.join( ',' ) } : undefined ),
		[ selectedIds ]
	);

	return (
		<Card.Root className="jpb-backup-detail">
			<Card.Header className="jpb-backup-detail__header">
				<Stack
					className="jpb-backup-detail__header-row"
					direction="row"
					align="center"
					justify="space-between"
				>
					<Stack
						className="jpb-backup-detail__header-title"
						direction="row"
						gap="xs"
						align="center"
					>
						<Icon icon={ cloud } />
						<Text variant="heading-md" render={ <h2 /> }>
							{ item.title }
						</Text>
					</Stack>
					<Stack
						className="jpb-backup-detail__header-actions"
						direction="row"
						gap="sm"
						align="center"
					>
						<Link
							to={ `/download/${ item.rewindId }` }
							// Cast for the same reason `screens/overview.tsx` casts
							// its `navigate` call: nothing registers a typed route
							// tree, so TanStack's search types collapse to shapes a
							// plain object cannot satisfy.
							search={ downloadSearch as never }
							className="jpb-backup-detail__download"
						>
							<Icon icon={ downloadIcon } size={ 18 } />
							{ downloadLabel( selectedIds.length ) }
						</Link>
						{ /*
						 * Deliberately not labelled from the file selection, and its
						 * link carries none.
						 *
						 * Download beside it now does both. The difference is that
						 * its count is keepable and this one is not: a restore
						 * point is restored whole, and there is no
						 * upstream shape for restoring a subset of files. So a
						 * count here could only ever promise a scope no layer can
						 * deliver, and the reader who trusts "Restore 3 selected
						 * items" confirms a full-site restore believing it is
						 * scoped.
						 */ }
						<Link to={ `/restore/${ item.rewindId }` } className="jpb-backup-detail__restore">
							<Icon icon={ rotateLeft } size={ 18 } />
							{ __( 'Restore to this point', 'jetpack-backup-pkg' ) }
						</Link>
					</Stack>
				</Stack>
			</Card.Header>
			<Card.Content className="jpb-backup-detail__body">
				<Text className="jpb-backup-detail__stats" dir="auto">
					{ item.stats }
				</Text>
				<Text variant="body-sm" className="jpb-text-muted jpb-backup-detail__by">
					{ createInterpolateElement(
						sprintf(
							/* translators: %1$s formatted date+time, %2$s actor name */
							__( '%1$s by %2$s', 'jetpack-backup-pkg' ),
							dateI18n( 'M j, Y, g:i A', item.publishedAt, undefined ),
							'<Actor />'
						),
						{ Actor: <bdi>{ item.actor.name }</bdi> }
					) }
				</Text>
				<div className="jpb-backup-detail__files">
					<div className="jpb-backup-detail__files-title">
						{ __( 'Files', 'jetpack-backup-pkg' ) }
					</div>
					<FileBrowser
						rewindId={ item.rewindId }
						selection={ selection }
						onSelectionChange={ setSelection }
						onSelectionIdsChange={ handleSelectionIdsChange }
					/>
				</div>
			</Card.Content>
		</Card.Root>
	);
}
