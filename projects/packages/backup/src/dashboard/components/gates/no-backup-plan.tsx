import { Card, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import LicenseKeyLink from './license-key-link';
import PromotedPrice from './promoted-price';
import UpgradeButton from './upgrade-button';

/**
 * Fallback shown when the site is fully connected but has no active
 * Backup plan.
 *
 * This is the whole purchase path for a site that is known to have no
 * Backup, so it carries both ways in: buy one, or redeem one already
 * bought. The purchase link itself lives in `<UpgradeButton>`.
 *
 * It is also the only screen that can carry it. Checkout needs a linked
 * WordPress.com connection, and this gate is reached only once there is
 * one — which is why the secondary-admin gate routes its reader through
 * linking to here rather than offering a shortcut they cannot complete.
 *
 * @return The rendered fallback.
 */
export default function NoBackupPlanScreen() {
	return (
		<Card className="jpb-gates__card">
			<Stack direction="column" gap="md" align="center">
				<Text variant="heading-md" render={ <h2 /> }>
					{ __( "This site doesn't have an active Backup plan", 'jetpack-backup-pkg' ) }
				</Text>
				<Notice status="info" isDismissible={ false }>
					{ __(
						'Add Jetpack Backup to start protecting your site with automatic backups, granular restores, and offsite storage.',
						'jetpack-backup-pkg'
					) }
				</Notice>
				<PromotedPrice />
				<UpgradeButton />
				<LicenseKeyLink />
			</Stack>
		</Card>
	);
}
