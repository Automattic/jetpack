import { Button, Card } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import LicenseKeyLink from './license-key-link';

/**
 * My Jetpack's account-link screen, for the reasons in `not-connected.tsx`.
 * Deep-linked past the landing page, and `skip_pricing` because the no-plan gate
 * already sells to the readers who need it.
 */
const JETPACK_CONNECT_USER_URL = 'admin.php?page=my-jetpack#/connection?skip_pricing=true';

/**
 * Fallback shown when the current user is an admin but isn't personally
 * linked to a WordPress.com account on this site.
 *
 * This screen cannot know whether the site has a Backup plan — the gate reaches
 * it from connection state alone — so every claim leads with its condition. No
 * purchase button either: checkout needs a linked connection, and linking is the
 * way forward for both readers.
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
