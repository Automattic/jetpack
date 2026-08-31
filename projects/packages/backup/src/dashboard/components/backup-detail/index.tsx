import { dateI18n } from '@wordpress/date';
import { useState } from '@wordpress/element';
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
 * the visitor has selected in the file browser. With zero selections we
 * default to the whole-backup download; otherwise we count the selected
 * items (files + folders) currently visible in the loaded tree.
 *
 * @param count - Number of currently selected items.
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
 * item" based on what the visitor has checked in the tree. Restore does
 * not switch — see its call site.
 *
 * @param props      - Component props.
 * @param props.item - The selected backup activity item.
 * @return The rendered detail card.
 */
export default function BackupDetail( { item }: Props ) {
	const [ selection, setSelection ] = useState< FileSelection >( EMPTY_FILE_SELECTION );
	// `count` labels the Download action only — Restore beside it is
	// deliberately unlabelled by selection, see its call site.
	//
	// `count` tracks how many opaque server-side download units the
	// current selection covers — files plus folders whose contents
	// haven't been loaded yet (each treated as one unit). Loaded
	// folders contribute via their leaves, not themselves;
	// indeterminate folders don't add to the count. FileBrowser owns
	// the loaded children, so it reports the count back here for the
	// Download label to swap between "Download backup" and "Download %d
	// selected item".
	const [ count, setCount ] = useState( 0 );

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
						<Link to={ `/download/${ item.rewindId }` } className="jpb-backup-detail__download">
							<Icon icon={ downloadIcon } size={ 18 } />
							{ downloadLabel( count ) }
						</Link>
						{ /*
						 * Deliberately not labelled from the file selection.
						 *
						 * Download beside it does not honour the selection yet
						 * either — JETPACK-2296 is what wires it. The difference is
						 * that its count is keepable in principle and this one is
						 * not: a restore point is restored whole, and there is no
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
				<Text className="jpb-backup-detail__stats">{ item.stats }</Text>
				<Text variant="body-sm" className="jpb-text-muted jpb-backup-detail__by">
					{ sprintf(
						/* translators: %1$s formatted date+time, %2$s actor name */
						__( '%1$s by %2$s', 'jetpack-backup-pkg' ),
						dateI18n( 'M j, Y, g:i A', item.publishedAt, undefined ),
						item.actor.name
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
						onSelectionCountChange={ setCount }
					/>
				</div>
			</Card.Content>
		</Card.Root>
	);
}
