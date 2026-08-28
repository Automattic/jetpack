import { Button, Card } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import LicenseKeyLink from './license-key-link';
import UpgradeButton from './upgrade-button';

/** My Jetpack, for the reasons spelled out in `not-connected.tsx`. */
const JETPACK_CONNECT_USER_URL = 'admin.php?page=my-jetpack';

/**
 * Fallback shown when the current user is an admin but isn't personally
 * linked to a WordPress.com account on this site.
 *
 * This screen cannot know whether the site has a Backup plan: the gate
 * reaches it from connection state alone, and the capabilities bridge
 * would answer 403 without a user connection, so there is nothing to ask.
 * That makes it the one gate that has to be right for both readers, so
 * every claim here is conditional: the condition leads, because a flat
 * "you'll see this site's backups" is false on a plan-less site and a
 * later "if it has a plan" does not retract it.
 *
 * Linking stays the primary action: on a site that does have a plan it is
 * the only thing standing between this reader and their backups. The
 * upgrade path is added beside it, not in place of it, and is a plain
 * link precisely so this screen keeps issuing no requests at all.
 *
 * @return The rendered fallback.
 */
export default function SecondaryAdminScreen() {
	return (
		<Card className="jpb-gates__card">
			<Stack direction="column" gap="md" align="center">
				<Text variant="heading-md" render={ <h2 /> }>
					{ __( 'Link your WordPress.com account', 'jetpack-backup-pkg' ) }
				</Text>
				<Text>
					{ __(
						"This site's Jetpack connection is already set up, but your account isn't linked to a WordPress.com user yet.",
						'jetpack-backup-pkg'
					) }
				</Text>
				<Text>
					{ __(
						"Once your account is linked, you'll see any backups this site has. If it doesn't have an active Backup plan yet, you can add VaultPress Backup to start protecting it.",
						'jetpack-backup-pkg'
					) }
				</Text>
				<Stack direction="row" gap="sm" justify="center" wrap="wrap">
					<Button variant="primary" href={ JETPACK_CONNECT_USER_URL }>
						{ __( 'Link my account', 'jetpack-backup-pkg' ) }
					</Button>
					<UpgradeButton variant="secondary" />
				</Stack>
				<LicenseKeyLink />
			</Stack>
		</Card>
	);
}
