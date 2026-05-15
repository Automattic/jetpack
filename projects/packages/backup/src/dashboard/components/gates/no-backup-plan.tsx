import { Card, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';

const UPGRADE_URL = 'https://jetpack.com/upgrade/backup/';

/**
 * Fallback shown when the site is fully connected but has no active
 * Backup plan.
 *
 * @return The rendered fallback.
 */
export default function NoBackupPlanScreen() {
	return (
		<Card className="jpb-gates__card">
			<Stack direction="column" gap="md" align="center">
				<Text variant="heading-md" render={ <h3 /> }>
					{ __( "This site doesn't have an active Backup plan", 'jetpack-backup-pkg' ) }
				</Text>
				<Notice status="info" isDismissible={ false }>
					{ __(
						'Add Jetpack Backup to start protecting your site with automatic backups, granular restores, and offsite storage.',
						'jetpack-backup-pkg'
					) }
				</Notice>
				<a className="jpb-gates__cta" href={ UPGRADE_URL } target="_blank" rel="noreferrer">
					{ __( 'See Backup plans', 'jetpack-backup-pkg' ) }
				</a>
			</Stack>
		</Card>
	);
}
