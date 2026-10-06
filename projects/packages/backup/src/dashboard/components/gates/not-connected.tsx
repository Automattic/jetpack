import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, plugins } from '@wordpress/icons';
import { Card, Stack, Text } from '@wordpress/ui';
import LicenseKeyLink from './license-key-link';

/**
 * My Jetpack, which owns connection for the standalone plugins.
 *
 * Not `admin.php?page=jetpack#/connection`, which reached a connection
 * screen on no site that could see it — by one of two mechanisms,
 * depending on what else is installed. Without the Jetpack plugin,
 * `page=jetpack` is a `__return_null` placeholder registered by
 * `packages/admin-ui` behind a `! $jetpack_plugin_present` guard, so the
 * page renders nothing at all. With it, that slug is the Jetpack React
 * app — whose router has no `/connection` route, so the hash falls to
 * the catch-all and is replaced with `#/dashboard`.
 *
 * My Jetpack cannot send the reader back here afterwards — its return-to
 * helper only accepts My Jetpack's own hash routes — so this is a
 * one-way trip. Still the better of the two.
 */
const JETPACK_CONNECT_URL = 'admin.php?page=my-jetpack';

/**
 * Fallback shown when Jetpack isn't fully connected to WPCOM.
 *
 * Links out rather than embedding `<ConnectButton>`: the connection
 * package pulls in SCSS that wp-build can't resolve cleanly today.
 *
 * @return The rendered fallback.
 */
export default function NotConnectedScreen() {
	return (
		<div className="jpb-gates__stage">
			<Card.Root className="jpb-gates__card">
				<Stack direction="column" gap="lg" align="start">
					<span className="jpb-gates__badge jpb-gates__badge--info" aria-hidden="true">
						<Icon icon={ plugins } />
					</span>
					<Text variant="heading-lg" render={ <h2 /> }>
						{ __( 'Connect Jetpack to get started', 'jetpack-backup-pkg' ) }
					</Text>
					<Text>
						{ __(
							'Backup needs an active Jetpack connection to show your backup history.',
							'jetpack-backup-pkg'
						) }
					</Text>
					<Stack direction="row" gap="lg" align="center" wrap="wrap" className="jpb-gates__actions">
						<Button variant="primary" href={ JETPACK_CONNECT_URL }>
							{ __( 'Connect Jetpack', 'jetpack-backup-pkg' ) }
						</Button>
						<LicenseKeyLink />
					</Stack>
				</Stack>
			</Card.Root>
		</div>
	);
}
