import { dateI18n } from '@wordpress/date';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, cloud, download as downloadIcon, rotateLeft } from '@wordpress/icons';
import { Link } from '@wordpress/route';
import { Card, Stack, Text } from '@wordpress/ui';
import FileBrowser, { EMPTY_FILE_SELECTION } from '../file-browser';
import './style.scss';
import type { FileSelection } from '../file-browser';
import type { BackupActivityItem } from '../../types/activity';

type Props = {
	item: BackupActivityItem;
};

/**
 * Returns the appropriate "Download" header-label given how many files
 * the visitor has selected in the file browser. With zero selections we
 * default to the whole-backup download; otherwise we count the selected
 * paths.
 *
 * @param count - Number of currently selected files/folders.
 * @return Localized button label.
 */
function downloadLabel( count: number ): string {
	if ( count === 0 ) {
		return __( 'Download backup', 'jetpack-backup-pkg' );
	}
	return sprintf(
		/* translators: %d count of selected files */
		__( 'Download %d selected files', 'jetpack-backup-pkg' ),
		count
	);
}

/**
 * Returns the appropriate "Restore" header-label given how many files
 * the visitor has selected in the file browser.
 *
 * @param count - Number of currently selected files/folders.
 * @return Localized button label.
 */
function restoreLabel( count: number ): string {
	if ( count === 0 ) {
		return __( 'Restore to this point', 'jetpack-backup-pkg' );
	}
	return sprintf(
		/* translators: %d count of selected files */
		__( 'Restore %d selected files', 'jetpack-backup-pkg' ),
		count
	);
}

/**
 * Right-pane detail card for a selected backup activity item.
 *
 * Shows the status header with Download / Restore actions linking to the
 * matching sibling routes, the backup's summary line, a timestamp by-line,
 * and the file browser. File selection state lives here so the header
 * actions can switch between "Download backup" and "Download N selected
 * files" based on what the visitor has checked in the tree.
 *
 * @param props      - Component props.
 * @param props.item - The selected backup activity item.
 * @return The rendered detail card.
 */
export default function BackupDetail( { item }: Props ) {
	const [ selection, setSelection ] = useState< FileSelection >( EMPTY_FILE_SELECTION );
	// "X selected files" in the header reflects the positive set only —
	// negative exceptions on a folder's subtree don't bump the count
	// up, so the label always matches what the visitor explicitly asked
	// for ("you picked N things, here are the exceptions inside them").
	const count = selection.selected.size;

	return (
		<Card.Root className="jpb-backup-detail">
			<Card.Header className="jpb-backup-detail__header">
				<Stack direction="row" align="center" justify="space-between">
					<Stack direction="row" gap="xs" align="center">
						<Icon icon={ cloud } />
						<Text variant="heading-md" render={ <h3 /> }>
							{ __( 'Backup and scan complete', 'jetpack-backup-pkg' ) }
						</Text>
					</Stack>
					<Stack direction="row" gap="sm" align="center">
						<Link to={ `/download/${ item.rewindId }` } className="jpb-backup-detail__download">
							<Icon icon={ downloadIcon } size={ 18 } />
							{ downloadLabel( count ) }
						</Link>
						<Link to={ `/restore/${ item.rewindId }` } className="jpb-backup-detail__restore">
							<Icon icon={ rotateLeft } size={ 18 } />
							{ restoreLabel( count ) }
						</Link>
					</Stack>
				</Stack>
			</Card.Header>
			<Card.Content className="jpb-backup-detail__body">
				<Text className="jpb-backup-detail__stats">{ item.stats }</Text>
				<Text size="small" variant="muted" className="jpb-backup-detail__by">
					{ sprintf(
						/* translators: %1$s formatted date+time, %2$s actor name */
						__( '%1$s by %2$s', 'jetpack-backup-pkg' ),
						dateI18n( 'M j, Y, g:i A', item.publishedAt, undefined ),
						item.actor.name
					) }
				</Text>
				<div className="jpb-backup-detail__files">
					<div className="jpb-backup-detail__files-title">
						{ __( 'FILES', 'jetpack-backup-pkg' ) }
					</div>
					<FileBrowser
						rewindId={ item.rewindId }
						selection={ selection }
						onSelectionChange={ setSelection }
					/>
				</div>
			</Card.Content>
		</Card.Root>
	);
}
