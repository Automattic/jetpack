import { dateI18n } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, cloud, download as downloadIcon, backup as backupIcon } from '@wordpress/icons';
import { Link } from '@wordpress/route';
import { Card, Stack, Text } from '@wordpress/ui';
import './style.scss';
import type { BackupActivityItem } from '../../types/activity';

type Props = {
	item: BackupActivityItem;
};

/**
 * Right-pane detail card for a selected backup activity item.
 *
 * Shows the status header with Download / Restore actions linking to the
 * matching sibling routes, the backup's summary line, a timestamp by-line,
 * and a `__files` slot reserved for the file browser (Task 4).
 *
 * @param props      - Component props.
 * @param props.item - The selected backup activity item.
 * @return The rendered detail card.
 */
export default function BackupDetail( { item }: Props ) {
	return (
		<Card className="jpb-backup-detail">
			<Stack
				direction="row"
				align="center"
				justify="space-between"
				className="jpb-backup-detail__header"
			>
				<Stack direction="row" gap="xs" align="center">
					<Icon icon={ cloud } />
					<Text variant="heading-md" render={ <h3 /> }>
						{ __( 'Backup and scan complete', 'jetpack-backup-pkg' ) }
					</Text>
				</Stack>
				<Stack direction="row" gap="sm" align="center">
					<Link to={ `/download/${ item.rewindId }` } className="jpb-backup-detail__download">
						<Icon icon={ downloadIcon } size={ 18 } />
						{ __( 'Download backup', 'jetpack-backup-pkg' ) }
					</Link>
					<Link to={ `/restore/${ item.rewindId }` } className="jpb-backup-detail__restore">
						<Icon icon={ backupIcon } size={ 18 } />
						{ __( 'Restore to this point', 'jetpack-backup-pkg' ) }
					</Link>
				</Stack>
			</Stack>
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
				{ /* Task 4 replaces this slot with the real file-browser tree. */ }
				<Text size="small" variant="muted">
					Files placeholder — Task 4 will replace this.
				</Text>
			</div>
		</Card>
	);
}
