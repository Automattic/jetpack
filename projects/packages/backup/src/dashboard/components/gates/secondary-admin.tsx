import { Button, Card } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import LicenseKeyLink from './license-key-link';

/**
 * My Jetpack, which owns connection for the standalone plugins.
 *
 * Not `admin.php?page=jetpack#/connection`: that screen belongs to the
 * Jetpack plugin, and the only thing that calls
 * `Jetpack_Backup::initialize()` is the standalone Backup plugin, where
 * `page=jetpack` is registered as a `__return_null` placeholder. The link
 * went nowhere for every site that could see it.
 *
 * My Jetpack cannot send the reader back here afterwards — its
 * return-to helper only accepts My Jetpack's own hash routes — so this
 * is a one-way trip. A dead link is the worse of the two.
 */
const JETPACK_CONNECT_USER_URL = 'admin.php?page=my-jetpack';

/**
 * Fallback shown when the current user is an admin but isn't personally
 * linked to a WordPress.com account on this site.
 *
 * Links out to the Jetpack settings connection screen rather than
 * embedding `<ConnectButton>` (see `not-connected.tsx` for the
 * wp-build/SCSS rationale).
 *
 * @return The rendered fallback.
 */
export default function SecondaryAdminScreen() {
	return (
		<Card className="jpb-gates__card">
			<Stack direction="column" gap="md" align="center">
				<Text variant="heading-md" render={ <h3 /> }>
					{ __( 'Link your account to view backups', 'jetpack-backup-pkg' ) }
				</Text>
				<Text>
					{ __(
						"This site's Jetpack connection is already set up, but your account isn't linked to a WordPress.com user yet.",
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
