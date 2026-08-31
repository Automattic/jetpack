import { Button, Card } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import LicenseKeyLink from './license-key-link';

/**
 * My Jetpack's account-link screen, for the reasons in `not-connected.tsx`.
 * Deep-linked past its landing page, which puts "Connect account" below the
 * product grid; `skip_pricing` because this reader may already be entitled,
 * and the no-plan gate sells to the ones who are not.
 */
const JETPACK_CONNECT_USER_URL = 'admin.php?page=my-jetpack#/connection?skip_pricing=true';

/**
 * Fallback shown when the current user is an admin but isn't personally
 * linked to a WordPress.com account on this site.
 *
 * This screen cannot know whether the site has a Backup plan: the gate
 * reaches it from connection state alone, and the capabilities bridge
 * would answer 403 without a user connection. So every claim leads with
 * its condition — a flat "you'll see this site's backups" is false on a
 * plan-less site, and a later hedge does not retract it.
 *
 * No purchase button, deliberately: checkout requires a linked
 * connection, so one here would hand this reader a flow they cannot
 * finish. Linking is the way forward for both readers — once linked, a
 * plan-less site lands on the no-plan gate and its working upsell.
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
						"Once your account is linked, you'll see any backups this site has. If it doesn't have an active Backup plan yet, you'll be able to add VaultPress Backup to start protecting it.",
						'jetpack-backup-pkg'
					) }
				</Text>
				<Button variant="primary" href={ JETPACK_CONNECT_USER_URL }>
					{ __( 'Link my account', 'jetpack-backup-pkg' ) }
				</Button>
				<LicenseKeyLink />
			</Stack>
		</Card>
	);
}
