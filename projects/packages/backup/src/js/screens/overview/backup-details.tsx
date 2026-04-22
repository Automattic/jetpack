/* eslint-disable jsdoc/require-returns */

import { Button, Card, CardBody, CardHeader, Icon, Tooltip } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { download, rotateLeft } from '@wordpress/icons';
import { gridiconToWordPressIcon } from '../../data/gridicons';
import { useFormattedTime } from '../../data/use-formatted-time';
import styles from './style.module.scss';
import type { ActivityLogEntry } from '../../data/types';
import type { FC, ReactElement } from 'react';

interface BackupDetailsProps {
	backup: ActivityLogEntry;
}

interface ComingSoonButtonProps {
	variant: 'tertiary' | 'primary';
	icon: ReactElement;
	children: string;
}

/**
 * Restore / download actions are rendered but disabled in the first
 * Overview port. A tooltip explains that the flow is coming soon and
 * points users back to the WPCOM UI meanwhile.
 *
 * @param props          - Component props.
 * @param props.variant  - Button variant.
 * @param props.icon     - Icon element to render in the button.
 * @param props.children - Button label.
 */
const ComingSoonButton: FC< ComingSoonButtonProps > = ( { variant, icon, children } ) => (
	<Tooltip
		text={ __(
			'Coming soon in Jetpack Backup. For now, you can manage this action on WordPress.com.',
			'jetpack-backup-pkg'
		) }
	>
		<Button variant={ variant } icon={ icon } disabled accessibleWhenDisabled>
			{ children }
		</Button>
	</Tooltip>
);

/**
 * Right-hand detail pane for a selected backup: summary, timestamp,
 * actor, and placeholder Download/Restore actions.
 *
 * @param props        - Component props.
 * @param props.backup - The activity log entry to display.
 */
const BackupDetails: FC< BackupDetailsProps > = ( { backup } ) => {
	const publishedTimestamp = backup.published || backup.last_published;
	const formattedTime = useFormattedTime( publishedTimestamp, {
		dateStyle: 'medium',
		timeStyle: 'short',
	} );

	const contentText = backup.content?.text ?? '';
	const actorName = backup.actor?.name ?? '';

	return (
		<Card>
			<CardHeader>
				<div className={ styles.detailsHeader }>
					<div className={ styles.detailsHeaderTitle }>
						<Icon icon={ gridiconToWordPressIcon( backup.gridicon ) } />
						<strong>{ backup.summary }</strong>
					</div>
					<div className={ styles.detailsHeaderActions }>
						<ComingSoonButton variant="tertiary" icon={ download }>
							{ __( 'Download backup', 'jetpack-backup-pkg' ) }
						</ComingSoonButton>
						<ComingSoonButton variant="primary" icon={ rotateLeft }>
							{ __( 'Restore to this point', 'jetpack-backup-pkg' ) }
						</ComingSoonButton>
					</div>
				</div>
			</CardHeader>
			<CardBody>
				<div className={ styles.detailsBody }>
					{ contentText && <span className={ styles.detailsSummary }>{ contentText }</span> }
					<div className={ styles.detailsMeta }>
						<span>{ formattedTime }</span>
						{ actorName && (
							<span>
								{ sprintf(
									/* translators: %s is the name of the person or system that performed the backup. */
									__( 'by %s', 'jetpack-backup-pkg' ),
									actorName
								) }
							</span>
						) }
					</div>
				</div>
			</CardBody>
		</Card>
	);
};

export default BackupDetails;
