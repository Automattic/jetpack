import { dateI18n } from '@wordpress/date';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Card, Stack, Text } from '@wordpress/ui';
import './style.scss';
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
					<Text variant="body-sm" className="jpb-text-muted jpb-activity-detail__by">
						<span>{ dateI18n( 'M j, Y, g:i A', item.publishedAt, undefined ) }</span>
						<span>
							{ createInterpolateElement(
								sprintf(
									/* translators: %s: actor name */
									__( 'By %s', 'jetpack-backup-pkg' ),
									'<Actor />'
								),
								{ Actor: <bdi>{ item.actor.name }</bdi> }
							) }
						</span>
					</Text>
					{ item.summary && <Text dir="auto">{ item.summary }</Text> }
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}
