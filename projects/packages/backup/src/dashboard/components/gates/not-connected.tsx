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
const JETPACK_CONNECT_URL = 'admin.php?page=my-jetpack';

/**
 * Fallback shown when Jetpack isn't fully connected to WPCOM.
 *
 * Links out to the Jetpack settings connection screen instead of
 * embedding `<ConnectButton>` — the connection package pulls in SCSS
 * that wp-build can't resolve cleanly today.
 *
 * @return The rendered fallback.
 */
export default function NotConnectedScreen() {
	return (
		<Card className="jpb-gates__card">
			<Stack direction="column" gap="md" align="center">
				<Text variant="heading-md" render={ <h3 /> }>
					{ __( 'Connect Jetpack to get started', 'jetpack-backup-pkg' ) }
				</Text>
				<Text>
					{ __(
						'Backup needs an active Jetpack connection to show your backup history.',
						'jetpack-backup-pkg'
					) }
				</Text>
				<Button variant="primary" href={ JETPACK_CONNECT_URL }>
					{ __( 'Connect Jetpack', 'jetpack-backup-pkg' ) }
				</Button>
				<LicenseKeyLink />
			</Stack>
		</Card>
	);
}
