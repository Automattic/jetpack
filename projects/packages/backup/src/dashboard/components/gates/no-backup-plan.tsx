import { __ } from '@wordpress/i18n';
import { Icon, check, lock } from '@wordpress/icons';
import { Card, Stack, Text } from '@wordpress/ui';
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
	const features = [
		__( 'Real-time cloud backups', 'jetpack-backup-pkg' ),
		__( 'Starts with 10GB of backup storage', 'jetpack-backup-pkg' ),
		__( '30-day archive & activity log', 'jetpack-backup-pkg' ),
		__( 'One-click restores', 'jetpack-backup-pkg' ),
	];

	return (
		<div className="jpb-gates__stage">
			<Card.Root className="jpb-gates__card">
				<Stack direction="column" gap="lg" align="start">
					<span className="jpb-gates__badge jpb-gates__badge--info" aria-hidden="true">
						<Icon icon={ lock } />
					</span>
					<Text variant="heading-lg" render={ <h2 /> }>
						{ __( 'Add a Jetpack Backup plan', 'jetpack-backup-pkg' ) }
					</Text>
					<Text>
						{ __(
							'Save every change with real-time backups and get back online with one-click restores.',
							'jetpack-backup-pkg'
						) }
					</Text>
					<PromotedPrice />
					<Stack direction="column" gap="sm" align="start">
						<Text variant="heading-md" render={ <h3 /> }>
							{ __( "What's included?", 'jetpack-backup-pkg' ) }
						</Text>
						<ul className="jpb-gates__features">
							{ features.map( feature => (
								<li key={ feature }>
									<Icon icon={ check } size={ 20 } />
									<Text>{ feature }</Text>
								</li>
							) ) }
						</ul>
					</Stack>
					<Stack direction="row" gap="lg" align="center" wrap="wrap" className="jpb-gates__actions">
						<UpgradeButton />
						<LicenseKeyLink />
					</Stack>
				</Stack>
			</Card.Root>
		</div>
	);
}
