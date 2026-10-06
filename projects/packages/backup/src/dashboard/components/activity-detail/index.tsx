import { dateI18n } from '@wordpress/date';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
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
					<Text variant="heading-md" render={ <h2 /> }>
						{ item.title }
					</Text>
					<Text variant="body-sm" className="jpb-text-muted">
						{ createInterpolateElement(
							sprintf(
								/* translators: %1$s formatted date+time, %2$s actor name */
								__( '%1$s · By %2$s', 'jetpack-backup-pkg' ),
								dateI18n( 'M j, Y, g:i A', item.publishedAt, undefined ),
								'<Actor />'
							),
							{ Actor: <bdi>{ item.actor.name }</bdi> }
						) }
					</Text>
					{ item.summary && <Text dir="auto">{ item.summary }</Text> }
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}
