import { dateI18n } from '@wordpress/date';
import { Card, Stack, Text } from '@wordpress/ui';
import type { NonBackupActivityItem } from '../../types/activity';

type Props = {
	item: NonBackupActivityItem;
};

/**
 * Right-pane detail card for non-backup activity rows (post publish,
 * upload, plugin update, theme update). Lighter than `<BackupDetail>` —
 * no Download/Restore actions, no file browser slot.
 *
 * @param props      - Component props.
 * @param props.item - The selected non-backup activity item.
 * @return The rendered activity-detail card.
 */
export default function ActivityDetail( { item }: Props ) {
	return (
		<Card.Root className="jpb-activity-detail">
			<Card.Content>
				<Stack direction="column" gap="sm">
					<Text variant="heading-md" render={ <h3 /> }>
						{ item.title }
					</Text>
					<Text variant="body-sm" className="jpb-text-muted">
						{ dateI18n( 'M j, Y, g:i A', item.publishedAt, undefined ) }
						{ ' · ' }
						{ item.actor.name }
					</Text>
					{ item.summary && <Text>{ item.summary }</Text> }
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}
