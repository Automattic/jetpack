import { Button, Card } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';

const JETPACK_CONNECT_URL = 'admin.php?page=jetpack#/connection';

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
			</Stack>
		</Card>
	);
}
